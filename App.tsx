
import React, { useState, useCallback, useEffect } from 'react';
import { IMenuItem, IOrderItem, ICustomer, ICurrency, INotification, IOrder, IProfile, PaymentMethod, IUser, IMenuItemVariant } from './types';
import { CURRENCIES, DEFAULT_TAX_RATE } from './constants';
import Header from './components/Header';
import MenuList from './components/MenuList';
import OrderSummary from './components/OrderSummary';
import AddItemModal from './components/AddItemModal';
import BillModal from './components/BillModal';
import Notification from './components/Notification';
import PastOrders from './components/PastOrders';
import PastOrderDetailModal from './components/PastOrderDetailModal';
import EditItemModal from './components/EditItemModal';
import ProfileModal from './components/ProfileModal';
import PaymentModal from './components/PaymentModal';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import { api } from './services/api';
import { logger } from './services/logger';
import { useAuth } from './context/AuthContext';


type Theme = 'light' | 'dark';
type ActiveView = 'menu' | 'pastOrders' | 'admin';

const App: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  
  const [profile, setProfile] = useState<IProfile | null>(null);
  const [orderItems, setOrderItems] = useState<IOrderItem[]>([]);
  const [customer, setCustomer] = useState<ICustomer>({ name: '', mobile: '' });
  const [currency, setCurrency] = useState<ICurrency>(CURRENCIES[0]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<IOrder | null>(null);
  const [notification, setNotification] = useState<INotification | null>(null);
  const [selectedPastOrder, setSelectedPastOrder] = useState<IOrder | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('menu');
  const [editingMenuItem, setEditingMenuItem] = useState<IMenuItem | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pastOrderCount, setPastOrderCount] = useState(0);
  const [menuRefreshKey, setMenuRefreshKey] = useState(0);
  const [isTaxIncluded, setIsTaxIncluded] = useState(false);


  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme') as Theme;
      if (storedTheme) return storedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Set initial view based on user role, and clear state on logout
  useEffect(() => {
    if (isAuthenticated && user) {
       if (user.role === 'admin') {
         setActiveView('admin');
       } else {
         setActiveView('menu');
       }
    } else {
        // Clear all session state on logout
        setProfile(null);
        setOrderItems([]);
        setCustomer({ name: '', mobile: '' });
        setPastOrderCount(0);
        setCompletedOrder(null);
        setActiveView('menu');
    }
  }, [isAuthenticated, user]);

  // Effect to automatically dismiss notifications after a delay
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000); // Notification stays for 3 seconds

      // Cleanup function to clear the timer if the component unmounts
      // or if another notification is shown before this one times out.
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (notif: INotification) => {
    setNotification(notif);
  };

  const fetchInitialData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
        const [profileData, orderCountData] = await Promise.all([
            api.get('/profile'),
            api.get('/orders/count')
        ]);
        setProfile(profileData);
        setPastOrderCount(orderCountData.count);
    } catch (error) {
        let message = 'Could not load initial data. Please try again later.';
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            message = 'Cannot connect to server. Is the backend running?';
        }
        logger.error('Failed to fetch initial data', { error: (error as Error).message });
        showNotification({ message, type: 'error' });
    }
}, [isAuthenticated]);

useEffect(() => {
    fetchInitialData();
}, [fetchInitialData]);


  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    logger.info('Theme changed', { theme: newTheme });
  };
  
  const handleCurrencyChange = (code: string) => {
    const newCurrency = CURRENCIES.find(c => c.code === code);
    if (newCurrency) {
      setCurrency(newCurrency);
      logger.info('Currency changed', { currency: newCurrency.code });
    }
  };

  const addToOrder = (itemToAdd: IMenuItem, selectedVariant: IMenuItemVariant) => {
    if (!selectedVariant) {
        logger.error('Attempted to add an item to order with a missing variant.', { item: itemToAdd });
        showNotification({ message: `Cannot add "${itemToAdd.name}": variant not available.`, type: 'error' });
        return;
    }
    
    setOrderItems(prevOrder => {
      const existingItemIndex = prevOrder.findIndex(
        orderItem => orderItem.item.id === itemToAdd.id && orderItem.selectedVariant.name === selectedVariant.name
      );

      if (existingItemIndex > -1) {
        const newOrder = [...prevOrder];
        newOrder[existingItemIndex] = {
          ...newOrder[existingItemIndex],
          quantity: newOrder[existingItemIndex].quantity + 1,
        };
        return newOrder;
      }
      return [...prevOrder, { item: itemToAdd, quantity: 1, selectedVariant }];
    });
  };

  const updateOrderQuantity = (itemId: string, variantName: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems(prevOrder => prevOrder.filter(
        orderItem => !(orderItem.item.id === itemId && orderItem.selectedVariant.name === variantName)
      ));
    } else {
      setOrderItems(prevOrder =>
        prevOrder.map(orderItem =>
          (orderItem.item.id === itemId && orderItem.selectedVariant.name === variantName)
            ? { ...orderItem, quantity: newQuantity }
            : orderItem
        )
      );
    }
  };

  const clearOrder = () => {
    setOrderItems([]);
    setCustomer({ name: '', mobile: '' });
  };

  const calculateSubtotal = useCallback(() => {
    return orderItems.reduce((total, orderItem) => {
       if (!orderItem || !orderItem.selectedVariant) {
          logger.error("Malformed order item found in calculation:", orderItem);
          return total; // Skip this item to prevent crash
      }
      return total + orderItem.selectedVariant.price * orderItem.quantity;
    }, 0);
  }, [orderItems]);

  const subtotal = calculateSubtotal();
  const taxRate = profile?.taxRate ?? DEFAULT_TAX_RATE;
  const tax = isTaxIncluded ? subtotal * taxRate : 0;
  const total = subtotal + tax;

  const handleProceedToPayment = () => {
    if (orderItems.length === 0) {
        showNotification({ message: 'Cannot save an empty order.', type: 'error' });
        return;
    }
    setShowPaymentModal(true);
  };
  
  const handleToggleTax = () => {
    setIsTaxIncluded(prev => !prev);
  }

  const handleSaveOrder = async (paymentMethod: PaymentMethod) => {
    setShowPaymentModal(false);
    
    const customerForOrder = {
      ...customer,
      name: customer.name.trim() === '' ? 'Cash' : customer.name,
    };

    const newOrderPayload: Omit<IOrder, 'id' | 'date'> = {
        customer: customerForOrder,
        items: orderItems,
        subtotal,
        tax,
        total,
        currency,
        paymentMethod,
    };

    try {
      const savedOrder = await api.post('/orders', newOrderPayload);
      setPastOrderCount(prev => prev + 1); // Increment count
      setCompletedOrder(savedOrder);
      setShowBillModal(true);
      logger.info('Order saved successfully', { orderId: savedOrder.id, total: savedOrder.total, paymentMethod });
      showNotification({ message: 'Order saved successfully! SMS notification sent.', type: 'success' });
      
    } catch(error) {
      showNotification({ message: 'Could not save the order.', type: 'error' });
    }
  };
  
  const handleAddNewItem = async (newItem: Omit<IMenuItem, 'id'>) => {
    try {
        const addedItem = await api.post('/menu', newItem);
        setMenuRefreshKey(prev => prev + 1); // Trigger refetch in MenuList
        setShowAddItemModal(false);
        logger.info('Menu item added', { name: addedItem.name, id: addedItem.id });
        showNotification({message: `${newItem.name} added to the menu!`, type: 'success'})
    } catch(error) {
        showNotification({ message: 'Could not add the new item.', type: 'error' });
    }
  };

  const handleStartEditItem = (itemToEdit: IMenuItem) => {
    setEditingMenuItem(itemToEdit);
  };
  
  const handleUpdateItem = async (updatedItem: IMenuItem) => {
    try {
       const { id, name, variants } = updatedItem;
       const returnedItem = await api.put(`/menu/${id}`, { name, variants });
       setMenuRefreshKey(prev => prev + 1); // Trigger refetch in MenuList
       setEditingMenuItem(null);
       logger.info('Menu item updated', { item: returnedItem });
       showNotification({message: `${returnedItem.name} has been updated.`, type: 'success'})
    } catch(error) {
        showNotification({ message: 'Could not update the item.', type: 'error' });
    }
  };
  
  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) {
        return;
    }
    try {
        await api.delete(`/menu/${itemId}`);
        setMenuRefreshKey(prev => prev + 1); // Trigger refetch in MenuList
        logger.info('Menu item deleted', { itemId });
        showNotification({ message: 'Item deleted successfully.', type: 'success' });
    } catch (error) {
        showNotification({ message: 'Could not delete the item.', type: 'error' });
    }
  };

  const handleDeleteMultipleItems = async (itemIds: string[]) => {
      if (itemIds.length === 0) return;
      if (!window.confirm(`Are you sure you want to delete ${itemIds.length} selected items?`)) {
          return;
      }
      try {
          await api.post('/menu/delete-many', { ids: itemIds });
          setMenuRefreshKey(prev => prev + 1); // Trigger refetch in MenuList
          logger.info('Multiple menu items deleted', { count: itemIds.length, itemIds });
          showNotification({ message: `${itemIds.length} items deleted successfully.`, type: 'success' });
      } catch (error) {
          showNotification({ message: 'Could not delete the selected items.', type: 'error' });
      }
  };

  const handleViewPastOrder = (order: IOrder) => {
    setSelectedPastOrder(order);
  };

  const handleSaveProfile = async (updatedProfile: Omit<IProfile, 'id'>) => {
    try {
        const savedProfile = await api.put('/profile', updatedProfile);
        setProfile(savedProfile);
        setShowProfileModal(false);
        logger.info('Profile updated successfully');
        showNotification({ message: 'Profile updated successfully!', type: 'success' });
    } catch(error) {
        showNotification({ message: 'Could not save the profile.', type: 'error' });
    }
  };
  
  if (!isAuthenticated || !user) {
    return <Login />;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <Header
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        onAddNewItem={() => setShowAddItemModal(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        activeView={activeView}
        onViewChange={setActiveView}
        pastOrderCount={pastOrderCount}
        onOpenProfile={() => setShowProfileModal(true)}
        user={user}
        onLogout={logout}
      />
      <main className="container mx-auto p-4 lg:p-8">
        {activeView === 'menu' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <MenuList 
                currency={currency} 
                onAddToOrder={addToOrder}
                onEditItem={handleStartEditItem}
                onDeleteItem={handleDeleteItem}
                onDeleteMultipleItems={handleDeleteMultipleItems}
                userRole={user.role}
                refreshKey={menuRefreshKey}
              />
            </div>
            <div className="sticky top-28 h-fit">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg transition-colors duration-300 p-6">
                <OrderSummary
                    orderItems={orderItems}
                    currency={currency}
                    customer={customer}
                    onCustomerChange={setCustomer}
                    onQuantityChange={updateOrderQuantity}
                    onClearOrder={clearOrder}
                    onProceedToPayment={handleProceedToPayment}
                    subtotal={subtotal}
                    tax={tax}
                    total={total}
                    isTaxIncluded={isTaxIncluded}
                    onToggleTax={handleToggleTax}
                    taxRate={taxRate}
                />
              </div>
            </div>
          </div>
        ) : activeView === 'pastOrders' ? (
           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-colors duration-300">
            <PastOrders onViewOrder={handleViewPastOrder} />
           </div>
        ) : (
          <AdminPanel />
        ) }
      </main>
      {showAddItemModal && (
        <AddItemModal
          onClose={() => setShowAddItemModal(false)}
          onAddItem={handleAddNewItem}
        />
      )}
       {editingMenuItem && (
        <EditItemModal
          item={editingMenuItem}
          onClose={() => setEditingMenuItem(null)}
          onUpdateItem={handleUpdateItem}
        />
       )}
       {showPaymentModal && (
        <PaymentModal
          total={total}
          currency={currency}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handleSaveOrder}
        />
       )}
       {showBillModal && completedOrder && (
        <BillModal
          order={completedOrder}
          profile={profile}
          onClose={() => {
            setShowBillModal(false);
            setCompletedOrder(null);
            clearOrder();
          }}
        />
      )}
      {selectedPastOrder && (
        <PastOrderDetailModal 
          order={selectedPastOrder}
          profile={profile}
          onClose={() => setSelectedPastOrder(null)}
        />
      )}
      {notification && <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification(null)} />}
      {showProfileModal && profile && (
        <ProfileModal
          profile={profile}
          onClose={() => setShowProfileModal(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
};

export default App;