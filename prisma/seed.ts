import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");
  await prisma.reservation.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const [mumbai, delhi, bangalore] = await Promise.all([
    prisma.warehouse.create({ data: { name: "Mumbai Fulfilment Hub", city: "Mumbai" } }),
    prisma.warehouse.create({ data: { name: "Delhi NCR Warehouse", city: "Delhi" } }),
    prisma.warehouse.create({ data: { name: "Bangalore Distribution Centre", city: "Bangalore" } }),
  ]);

  const productDefs = [
    // ── SUPPLEMENTS ────────────────────────────────────────────────
    {
      name: "KSM-66 Ashwagandha 600mg",
      description: "Clinically proven root extract standardised to 5% withanolides. Reduces cortisol, supports testosterone levels, and improves strength and recovery. 90 vegetarian capsules.",
      price: 69900, category: "Supplements",
      imageUrl: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Testosterone Support Complex",
      description: "Triple-action formula: Zinc Bisglycinate 30mg + Magnesium Glycinate 300mg + Vitamin D3 2000IU. Supports natural hormone production and deep sleep. 60 capsules.",
      price: 59900, category: "Supplements",
      imageUrl: "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Creatine Monohydrate 250g",
      description: "Micronised Creapure® creatine — the gold standard for strength, power, and lean muscle. Unflavoured, mixes instantly. 50 servings of 5g each.",
      price: 49900, category: "Supplements",
      imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Omega-3 Fish Oil 2000mg",
      description: "Triple-strength EPA 660mg + DHA 440mg per softgel. Molecularly distilled, heavy-metal tested. Supports heart, brain, and joint health. 60 softgels.",
      price: 39900, category: "Supplements",
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Whey Protein Isolate 1kg",
      description: "Cold-processed whey isolate — 27g protein, <1g fat, <1g carbs per 30g serving. No artificial colours. Chocolate Fudge and Unflavoured variants. Lab-tested for banned substances.",
      price: 149900, category: "Supplements",
      imageUrl: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "L-Arginine + L-Citrulline 3000mg",
      description: "Synergistic nitric oxide stack — 1500mg L-Arginine HCL + 1500mg L-Citrulline per serving. Enhances blood flow, endurance, and pumps. 60 capsules.",
      price: 79900, category: "Supplements",
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Pre-Workout Nitro Blast 200g",
      description: "200mg natural caffeine, Beta-Alanine 3.2g, and Citrulline Malate 6g per serving. 20 servings, Watermelon & Berry variants. Clean energy, no crash.",
      price: 99900, category: "Supplements",
      imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80",
    },

    // ── HAIR CARE ──────────────────────────────────────────────────
    {
      name: "5% Minoxidil Topical Solution 60ml",
      description: "Clinically proven to regrow hair in men. Foam formula with no propylene glycol. Twice-daily application, visible results in 12–16 weeks. 1-month supply.",
      price: 49900, category: "Hair Care",
      imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "DHT Blocker Scalp Shampoo 200ml",
      description: "Saw palmetto + Ketoconazole 1% shampoo. Blocks DHT at the scalp, reduces shedding and dandruff. Sulphate-free, paraben-free. Safe for daily use.",
      price: 39900, category: "Hair Care",
      imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Biotin 10,000mcg + Keratin Capsules",
      description: "High-potency Biotin with hydrolysed Keratin, Bamboo Silica, and Zinc. Strengthens hair shaft, reduces breakage, and promotes visible thickness. 60 capsules.",
      price: 59900, category: "Hair Care",
      imageUrl: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Redensyl + Procapil Hair Serum 50ml",
      description: "Clinically studied actives: Redensyl 3% + Procapil 0.5% + Anagain in a lightweight serum. Stimulates dormant follicles and reduces hair fall by up to 46% in 3 months.",
      price: 79900, category: "Hair Care",
      imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Caffeine Scalp Tonic 100ml",
      description: "Topical caffeine 0.2% + Niacinamide + Panthenol scalp tonic. Stimulates microcirculation, strengthens roots, and reduces telogen effluvium. No-rinse spray formula.",
      price: 34900, category: "Hair Care",
      imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80",
    },

    // ── SKIN CARE ──────────────────────────────────────────────────
    {
      name: "Niacinamide 10% + Zinc 1% Serum 30ml",
      description: "High-strength Niacinamide reduces enlarged pores, controls sebum, fades dark spots, and strengthens the skin barrier. Lightweight water-gel texture. Fragrance-free.",
      price: 44900, category: "Skin Care",
      imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "SPF 50 PA++++ Matte Sunscreen 50g",
      description: "Broad-spectrum UVA/UVB protection with Tinosorb filters. Zero white cast, matte finish designed for Indian skin tones. Water-resistant for 80 minutes.",
      price: 34900, category: "Skin Care",
      imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Retinol 0.3% + Peptide Night Cream 30g",
      description: "Encapsulated retinol (slow-release) with Matrixyl 3000 peptides. Reduces fine lines, uneven texture, and post-acne marks overnight. Ideal for beginners.",
      price: 64900, category: "Skin Care",
      imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Vitamin C 15% Brightening Serum 30ml",
      description: "Stabilised L-Ascorbic Acid 15% + Ferulic Acid + Vitamin E. Fades hyperpigmentation, boosts collagen synthesis, and provides antioxidant protection. Airless pump bottle.",
      price: 54900, category: "Skin Care",
      imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Salicylic Acid 2% Acne Face Wash 100ml",
      description: "BHA-powered face wash for acne-prone and oily skin. Unclogs pores, dissolves dead skin cells, and prevents new breakouts. Gentle enough for twice-daily use.",
      price: 29900, category: "Skin Care",
      imageUrl: "https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=600&auto=format&fit=crop&q=80",
    },

    // ── SEXUAL WELLNESS ────────────────────────────────────────────
    {
      name: "Long-Last Delay Spray 20ml",
      description: "10% Lidocaine topical spray for targeted desensitisation. Fast-absorbing, no transfer formula. Clinically formulated for discreet use. 150+ applications per bottle.",
      price: 49900, category: "Sexual Wellness",
      imageUrl: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Premium Water-Based Lubricant 100ml",
      description: "pH-balanced, glycerin-free personal lubricant. Compatible with latex and silicone. Dermatologically tested, hypoallergenic. Condom-safe long-lasting formula.",
      price: 29900, category: "Sexual Wellness",
      imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Performance Gummies — Maca + Ginseng",
      description: "Daily men's wellness gummy with KSM-66 Ashwagandha, Maca Root, Panax Ginseng, and Zinc. Supports stamina, drive, and energy naturally. 30-day supply, 2 gummies daily.",
      price: 69900, category: "Sexual Wellness",
      imageUrl: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Intimate Hygiene Wash pH 3.5 100ml",
      description: "Specially formulated pH 3.5 intimate wash for men. Lactic Acid and Aloe Vera soothe and protect sensitive skin. Fragrance-free, dermatologically tested.",
      price: 34900, category: "Sexual Wellness",
      imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Stamina & Endurance Capsules 60ct",
      description: "Shilajit Extract 500mg + Safed Musli 400mg + Tribulus 300mg. Ayurvedic adaptogens for sustained energy, vitality, and endurance. 2-month supply.",
      price: 79900, category: "Sexual Wellness",
      imageUrl: "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?w=600&auto=format&fit=crop&q=80",
    },

    // ── VITAMINS & MINERALS ────────────────────────────────────────
    {
      name: "Vitamin D3 2000IU + K2 MK-7 60 Softgels",
      description: "Cholecalciferol D3 in MCT oil base for optimal absorption, paired with MenaQ7® K2 to direct calcium to bones. Essential for testosterone production and immune health.",
      price: 34900, category: "Vitamins & Minerals",
      imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Zinc Bisglycinate 50mg 60 Tablets",
      description: "Highly bioavailable chelated zinc — 3× better absorbed than zinc oxide. Critical for testosterone synthesis, immune function, and reproductive health.",
      price: 29900, category: "Vitamins & Minerals",
      imageUrl: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "Magnesium Glycinate 400mg 60 Capsules",
      description: "Gentle, non-laxative magnesium chelate for deep sleep, muscle relaxation, stress reduction, and testosterone support. Free of magnesium oxide fillers.",
      price: 49900, category: "Vitamins & Minerals",
      imageUrl: "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?w=600&auto=format&fit=crop&q=80",
    },
    {
      name: "B-Complex with Methylcobalamin B12 60 Tablets",
      description: "Complete B-vitamin complex with Methylcobalamin B12 1000mcg and Biotin 1000mcg. Supports energy metabolism, nerve health, and hair and skin quality.",
      price: 34900, category: "Vitamins & Minerals",
      imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80",
    },
  ];

  const products = await Promise.all(
    productDefs.map((p) => prisma.product.create({ data: p }))
  );

  const warehouses = [mumbai, delhi, bangalore];
  const stockData: { productId: string; warehouseId: string; totalUnits: number }[] = [];

  products.forEach((product, i) => {
    warehouses.forEach((wh, j) => {
      const base = 8 + Math.floor(Math.random() * 25);
      let units = base;
      if (i % 4 === 0 && j === 1) units = 1 + Math.floor(Math.random() * 3);
      if (i % 6 === 0 && j === 2) units = 0;
      if ([0, 7, 12, 17, 22].includes(i)) units = Math.min(units, 4);
      stockData.push({ productId: product.id, warehouseId: wh.id, totalUnits: units });
    });
  });

  await prisma.stock.createMany({ data: stockData });
  console.log(`✓ Seeded ${products.length} products, 3 warehouses, ${stockData.length} stock entries`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
