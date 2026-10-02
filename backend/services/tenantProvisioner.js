const { getMasterModels } = require('../config/masterDb');
const { getTenantConnection } = require('../config/tenantManager');

const SAMPLE_MENU_ITEMS = [
  {
    name: 'Classic Margherita Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500',
    variants: [
      { name: 'Regular (8")', price: 199 },
      { name: 'Medium (10")', price: 299 },
      { name: 'Large (12")', price: 399 }
    ]
  },
  {
    name: 'Artisan Espresso / Cappuccino',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500',
    variants: [
      { name: 'Single Shot', price: 99 },
      { name: 'Double Shot', price: 149 }
    ]
  },
  {
    name: 'Gourmet Cheese Burger',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
    variants: [
      { name: 'Single Patty', price: 149 },
      { name: 'Double Patty & Bacon', price: 229 }
    ]
  },
  {
    name: 'Crispy French Fries',
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500',
    variants: [
      { name: 'Regular', price: 89 },
      { name: 'Peri Peri Loaded', price: 129 }
    ]
  }
];

/**
 * Provisions a completely isolated database and credentials for a new restaurant.
 * Automatically generates clean URL slugs without requiring user input.
 */
async function provisionTenant({
  name,
  slug,
  ownerName,
  ownerUsername,
  ownerEmail,
  ownerPassword,
  ownerPhone = '',
  currency = 'INR',
  currencySymbol = '₹',
  taxRate = 0.05
}) {
  const { Tenant, Subscription } = getMasterModels();

  // 1. Auto-generate slug from restaurant name if not provided
  let normalizedSlug = (slug || name || 'bistro')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);

  if (normalizedSlug.length < 3) {
    normalizedSlug = 'bistro-' + Math.floor(1000 + Math.random() * 9000);
  }

  // Check uniqueness and auto-append digits on collision
  let existingTenant = await Tenant.findOne({ slug: normalizedSlug });
  if (existingTenant) {
    normalizedSlug = `${normalizedSlug}-${Math.floor(100 + Math.random() * 900)}`;
  }

  const dbName = `quickbill_tenant_${normalizedSlug.replace(/-/g, '_')}`;

  // 2. 14-day free trial on Starter plan
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  // 3. Username sanitization
  const cleanUsername = (ownerUsername || ownerEmail.split('@')[0])
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, '_');

  // 4. Create Tenant entry in Master DB
  const tenant = await Tenant.create({
    slug: normalizedSlug,
    name,
    ownerName,
    ownerUsername: cleanUsername,
    ownerEmail: ownerEmail.toLowerCase().trim(),
    ownerPhone,
    dbName,
    status: 'trialing',
    trialEndsAt,
    activePlan: 'starter',
    settings: {
      currency,
      currencySymbol,
      taxRate
    }
  });

  // 5. Create Trial Subscription entry in Master DB
  await Subscription.create({
    tenantId: tenant._id,
    planId: 'starter',
    status: 'trialing',
    billingCycle: 'monthly',
    currentPeriodStart: new Date(),
    currentPeriodEnd: trialEndsAt,
    trialEndsAt
  });

  // 6. Connect to the isolated Tenant Database
  const { models } = await getTenantConnection(normalizedSlug);

  // 7. Seed the primary Restaurant Billing User in the tenant's isolated DB
  // Role is 'staff' so they only have access to bill & manage menu, without staff admin portal access
  const primaryUser = await models.User.create({
    username: cleanUsername,
    password: ownerPassword,
    role: 'staff'
  });

  // 8. Seed Restaurant Profile in the tenant's isolated DB
  await models.Profile.create({
    restaurantName: name,
    phone: ownerPhone || 'N/A',
    taxRate: taxRate,
    userId: primaryUser._id
  });

  // 9. Seed Sample Menu Items so the restaurant can start billing immediately
  for (const item of SAMPLE_MENU_ITEMS) {
    await models.MenuItem.create({
      name: item.name,
      variants: item.variants,
      imageUrl: item.imageUrl,
      userId: primaryUser._id
    });
  }

  console.log(`[Provisioner] Successfully provisioned restaurant workspace: ${normalizedSlug}`);

  // Generate auth token
  const token = primaryUser.getSignedJwtToken(normalizedSlug);

  return {
    success: true,
    tenant: {
      id: tenant._id,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status,
      activePlan: tenant.activePlan,
      trialEndsAt: tenant.trialEndsAt
    },
    user: {
      id: primaryUser._id,
      username: primaryUser.username,
      role: primaryUser.role
    },
    token
  };
}

module.exports = {
  provisionTenant
};
