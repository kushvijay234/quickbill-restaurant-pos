import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModalContainer } from '../components/common/ModalContainer';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../constants/colors';

export const EditMenuItemModal = ({ visible, onClose, item, onUpdate }) => {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setVariants(
        (item.variants || []).map((v) => ({
          name: v.name,
          price: v.price.toString(),
        }))
      );
    }
  }, [item]);

  const handleAddVariantRow = () => {
    setVariants([...variants, { name: '', price: '' }]);
  };

  const handleRemoveVariantRow = (index) => {
    if (variants.length <= 1) {
      Alert.alert('Notice', 'At least one variant is required');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    const next = [...variants];
    next[index][field] = value;
    setVariants(next);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Item name is required');
      return;
    }

    const cleanVariants = [];
    for (const v of variants) {
      const vName = v.name.trim() || 'Regular';
      const vPrice = parseFloat(v.price);
      if (isNaN(vPrice) || vPrice < 0) {
        Alert.alert('Validation Error', `Please enter a valid price for variant "${vName}"`);
        return;
      }
      cleanVariants.push({ name: vName, price: vPrice });
    }

    try {
      setLoading(true);
      await onUpdate({
        ...item,
        name: name.trim(),
        variants: cleanVariants,
      });
      onClose();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update menu item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer visible={visible} onClose={onClose} title="Edit Menu Item">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <Input
          label="Item Name *"
          value={name}
          onChangeText={setName}
          placeholder="Menu Item Name"
        />

        <View style={styles.variantsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Variants & Prices</Text>
          <TouchableOpacity onPress={handleAddVariantRow} style={styles.addVariantBtn}>
            <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
            <Text style={[styles.addVariantText, { color: COLORS.primary }]}>Add Option</Text>
          </TouchableOpacity>
        </View>

        {variants.map((v, idx) => (
          <View key={idx} style={styles.variantRow}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Option Name"
                value={v.name}
                onChangeText={(val) => handleVariantChange(idx, 'name', val)}
                style={{ marginBottom: 0 }}
              />
            </View>
            <View style={{ width: 110 }}>
              <Input
                placeholder="Price"
                value={v.price}
                onChangeText={(val) => handleVariantChange(idx, 'price', val)}
                keyboardType="numeric"
                style={{ marginBottom: 0 }}
              />
            </View>
            {variants.length > 1 && (
              <TouchableOpacity
                onPress={() => handleRemoveVariantRow(idx)}
                style={styles.deleteVariantBtn}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        <Button
          title="Save Changes"
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          style={styles.saveBtn}
        />
      </ScrollView>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  variantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  addVariantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addVariantText: {
    fontSize: 13,
    fontWeight: '700',
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  deleteVariantBtn: {
    padding: 8,
  },
  saveBtn: {
    marginTop: 12,
  },
});
