import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bookmark, BookmarkCheck, Search, Sparkles, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '../../store/uiStore'
import { useBookmarkStore } from '../../store/bookmarkStore'
import styles from './WellnessTips.module.css'
import axios from 'axios'

// ─── Full article pool (14 articles, rotated daily) ───────────────────────────
export const ALL_TIPS = [
  {
    id: 1,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1614790840969-62b5d53ef994?w=600&h=400&fit=crop',
    en: {
      title: 'Dodo vs. Boli (Plantains)',
      summary: 'Choose roasted over fried to cut hidden fats by up to 70%.',
      text: 'Fried plantain (Dodo) soaks up a surprising amount of oil during cooking. Boiled or roasted plantain (Boli) gives you the same rich, sweet flavour along with potassium and dietary fibre — with up to 70% fewer calories. A small swap with a big impact.',
    },
    fr: {
      title: 'Dodo contre Boli',
      summary: 'Choisissez le plantain rôti pour réduire les graisses de 70%.',
      text: "La banane plantain frite (Dodo) absorbe une quantité surprenante d'huile. Bouillie ou grillée (Boli), elle offre la même saveur avec jusqu'à 70% de calories en moins et conserve tout son potassium.",
    },
  },
  {
    id: 2,
    category: 'hydration',
    image: 'https://images.unsplash.com/photo-1555529771-7888783a18d3?w=600&h=400&fit=crop',
    en: {
      title: 'Zobo — Natural Blood Pressure Aid',
      summary: 'Unsweetened hibiscus tea is one of the best drinks for your heart.',
      text: 'Zobo (hibiscus tea) contains anthocyanins that naturally lower blood pressure and act as antioxidants. The problem is most vendors load it with sugar, which cancels the benefit. Make it at home, sweeten lightly with honey, ginger, or pineapple, and drink 1–2 cups a day.',
    },
    fr: {
      title: 'Le Bissap contre la tension',
      summary: 'Le thé d\'hibiscus non sucré est excellent pour le cœur.',
      text: 'Le Bissap contient des anthocyanes qui abaissent naturellement la tension artérielle. Fait maison avec peu de sucre et relevé de gingembre ou d\'ananas, 1 à 2 verres par jour font une vraie différence.',
    },
  },
  {
    id: 3,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&h=400&fit=crop',
    en: {
      title: 'Egusi Soup & the Oil Problem',
      summary: 'Cut palm oil by half to preserve protein without the cholesterol spike.',
      text: 'Egusi (melon seeds) are packed with protein, zinc, and healthy fats. Traditional recipes often use an excessive amount of palm oil that can spike LDL cholesterol. Halving the oil still gives you rich depth of flavour while making the dish heart-friendlier.',
    },
    fr: {
      title: 'Sauce Egusi & huile de palme',
      summary: "Réduisez l'huile de moitié pour protéger votre cœur.",
      text: "Les graines d'egusi sont riches en protéines et en zinc. Mais la recette classique nage souvent dans l'huile de palme, ce qui fait grimper le mauvais cholestérol. Réduire l'huile de moitié préserve le goût tout en protégeant votre santé.",
    },
  },
  {
    id: 4,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop',
    en: {
      title: "Bitter Leaf — Don't Wash It All Away",
      summary: 'The bitterness is where the medicine lives. Rinse lightly.',
      text: 'Bitter leaf (Onugbu) contains luteolin and other antioxidants that support liver detoxification and help manage blood sugar. Over-washing strips away these active compounds. Rinse gently, keep some of that bitter edge, and your soup becomes a functional food.',
    },
    fr: {
      title: 'Feuille amère — ne la lavez pas trop',
      summary: "L'amertume est là où se trouvent les principes actifs.",
      text: "La feuille amère contient de la lutéoline et des antioxydants qui soutiennent le foie et régulent la glycémie. Un lavage excessif élimine ces composés. Rincez légèrement pour préserver ses bienfaits.",
    },
  },
  {
    id: 5,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1588347818036-c3a7f2f71d56?w=600&h=400&fit=crop',
    en: {
      title: 'Suya — Lean Protein Done Right',
      summary: "Suya is naturally high in protein — it's the yaji that does the damage.",
      text: 'Lean beef or chicken suya is an excellent protein source, roughly 25g per 100g serving. The nutritional danger comes from the yaji spice mix, which is often heavy in salt, and the raw onions and tomatoes served alongside are genuinely beneficial. Enjoy suya, just watch the portion of the spice rub.',
    },
    fr: {
      title: 'Le Suya — protéine maigre bien cuisinée',
      summary: "Le suya est riche en protéines, c'est le yaji qui pose problème.",
      text: "Le bœuf ou le poulet suya maigre offre environ 25g de protéines pour 100g. C'est le mélange yaji, souvent riche en sel, qui est à surveiller. Les oignons crus et tomates servis avec sont, eux, très bénéfiques.",
    },
  },
  {
    id: 6,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1536411396859-3b8dba6e8022?w=600&h=400&fit=crop',
    en: {
      title: 'Garden Eggs — The Overlooked Superfood',
      summary: 'Low calorie, high fibre, and excellent for blood sugar control.',
      text: "Garden eggs (African eggplant) are only about 25 calories per 100g while being rich in fibre, potassium, and B vitamins. They have a low glycaemic index, making them ideal for weight management and blood sugar regulation. They're delicious raw with groundnut paste or cooked into soups.",
    },
    fr: {
      title: "L'aubergine africaine — le super-aliment oublié",
      summary: 'Faible en calories, riche en fibres, excellent pour la glycémie.',
      text: "L'aubergine africaine (garden egg) ne compte que 25 kcal pour 100g. Riche en fibres, potassium et vitamines B, à faible index glycémique, elle convient parfaitement aux personnes souhaitant contrôler leur glycémie ou leur poids.",
    },
  },
  {
    id: 7,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1565299543923-37de65d01a8c?w=600&h=400&fit=crop',
    en: {
      title: 'Moringa — A Leaf Worth Taking Seriously',
      summary: 'Gram for gram, moringa has more calcium than milk and more iron than spinach.',
      text: 'Moringa (Ewe Igbale) leaves contain all 9 essential amino acids, making it one of the few plant-based complete proteins. It is rich in iron, calcium, and vitamins A, C, and E. Add the powder to smoothies, soups, or stews — a teaspoon a day is enough to notice a difference in energy levels.',
    },
    fr: {
      title: 'Le Moringa — une feuille à prendre au sérieux',
      summary: 'Gram pour gram, plus de calcium que le lait et de fer que les épinards.',
      text: "Les feuilles de moringa contiennent les 9 acides aminés essentiels. Riches en fer, calcium, vitamines A, C et E, ajoutez une cuillère à café de poudre dans vos soupes ou smoothies chaque jour pour un regain d'énergie notable.",
    },
  },
  {
    id: 8,
    category: 'hydration',
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&h=400&fit=crop',
    en: {
      title: 'Tiger Nut Milk (Kunu Aya)',
      summary: 'A dairy-free prebiotic drink that supports gut health naturally.',
      text: "Kunu Aya (tiger nut milk) is one of West Africa's best kept secrets. Tiger nuts are not actually nuts — they're small root vegetables packed with resistant starch, which acts as a prebiotic, feeding your good gut bacteria. Unlike dairy, it is lactose-free and contains healthy fats similar to olive oil.",
    },
    fr: {
      title: 'Lait de souchet (Kunu Aya)',
      summary: 'Une boisson prébiotique sans lactose qui soutient le microbiome.',
      text: "Le Kunu Aya est l'un des secrets les mieux gardés de l'Afrique de l'Ouest. Les souchets contiennent de l'amidon résistant, un prébiotique naturel qui nourrit les bonnes bactéries intestinales. Sans lactose et riche en bonnes graisses proches de l'huile d'olive.",
    },
  },
  {
    id: 9,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&h=400&fit=crop',
    en: {
      title: 'Pineapple & Digestion',
      summary: 'Bromelain in pineapple actively breaks down protein and reduces bloating.',
      text: 'Fresh pineapple contains bromelain, a powerful enzyme that breaks down protein and reduces post-meal bloating. Eating a few slices after a heavy protein meal (e.g., egusi, beans, or suya) can significantly ease digestion. Avoid canned pineapple — the bromelain is destroyed during processing.',
    },
    fr: {
      title: 'Ananas et digestion',
      summary: "La bromélaïne de l'ananas décompose les protéines et réduit les ballonnements.",
      text: "L'ananas frais contient de la bromélaïne, une enzyme puissante qui aide à décomposer les protéines. Quelques tranches après un repas riche en protéines (egusi, haricots, suya) facilitent nettement la digestion. Évitez l'ananas en conserve — la bromélaïne y est détruite.",
    },
  },
  {
    id: 10,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&h=400&fit=crop',
    en: {
      title: 'Okra — The Slime Has a Purpose',
      summary: "Okra's viscous fibre slows sugar absorption and lowers cholesterol.",
      text: "The slimy texture of okra comes from mucilaginous fibre, which coats the gut lining and slows the absorption of glucose into the bloodstream — effectively lowering the glycaemic index of your entire meal. It also binds to cholesterol for excretion. Don't overcook it; keep some slime.",
    },
    fr: {
      title: 'Le gombo — la bave a une utilité',
      summary: "Les fibres visqueuses du gombo ralentissent l'absorption du sucre.",
      text: "La texture collante du gombo vient de ses fibres mucilagineuses qui tapissent la paroi intestinale et ralentissent l'absorption du glucose. Cela réduit l'indice glycémique global du repas. Ne trop le cuire — gardez un peu de ce mucus bénéfique.",
    },
  },
  {
    id: 11,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1630409346824-4f0e7b080087?w=600&h=400&fit=crop',
    en: {
      title: "Ogbono — Fibre You Don't See",
      summary: 'Ogbono seeds are a hidden source of soluble fibre and healthy fats.',
      text: 'Ogbono (wild mango seeds) thicken soup but also provide soluble dietary fibre, which feeds gut bacteria and slows digestion to keep you full longer. They also contain oleic acid — the same fat found in avocados and olive oil. A bowl of ogbono soup is more nutritious than it looks.',
    },
    fr: {
      title: "L'Ogbono — les fibres invisibles",
      summary: "Les graines d'ogbono sont une source cachée de fibres et de bonnes graisses.",
      text: "Les graines d'ogbono (mangue sauvage) épaississent la soupe mais apportent aussi des fibres solubles qui nourrissent le microbiome et prolongent la satiété. Elles contiennent de l'acide oléique — la même graisse que dans l'avocat et l'huile d'olive.",
    },
  },
  {
    id: 12,
    category: 'hydration',
    image: 'https://images.unsplash.com/photo-1571590648029-67cf36745bfd?w=600&h=400&fit=crop',
    en: {
      title: 'Ogi / Akamu — Not Just Baby Food',
      summary: 'Fermented pap is a probiotic that supports gut immunity.',
      text: 'Ogi (corn pap) is made through fermentation, which produces lactic acid bacteria — the same type found in yoghurt. These probiotics support gut immunity and can help with inflammation. The thick version (without too much water) eaten with fried fish or eggs is a genuinely balanced, low-cost breakfast.',
    },
    fr: {
      title: 'Ogi / Akamu — pas seulement pour bébé',
      summary: "La bouillie fermentée est un probiotique pour l'immunité intestinale.",
      text: "L'Ogi est fabriqué par fermentation, produisant des bactéries lactiques similaires à celles du yaourt. Ces probiotiques renforcent l'immunité intestinale et réduisent l'inflammation. Épais, avec du poisson frit ou des œufs, c'est un petit-déjeuner équilibré et économique.",
    },
  },
  {
    id: 13,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1553787434-dd9eb4ea4d0c?w=600&h=400&fit=crop',
    en: {
      title: 'Groundnuts — The Portable Protein',
      summary: 'A handful of groundnuts is one of the best affordable snacks you can eat.',
      text: "Raw or dry-roasted groundnuts (peanuts) provide about 7g of protein and 2g of fibre per small handful. They're rich in magnesium, niacin, and resveratrol — the same antioxidant found in red wine. Avoid the heavily salted or sugar-coated varieties. Buy plain and roast them yourself.",
    },
    fr: {
      title: 'Les arachides — protéines portables',
      summary: "Une poignée d'arachides est l'un des meilleurs encas abordables.",
      text: "Une petite poignée d'arachides non salées fournit 7g de protéines et 2g de fibres. Elles sont riches en magnésium, niacine et resvératrol. Évitez les variétés salées ou sucrées. Achetez-les nature et grilllez-les vous-même.",
    },
  },
  {
    id: 14,
    category: 'hydration',
    image: 'https://images.unsplash.com/photo-1559181567-c3190ca9be46?w=600&h=400&fit=crop',
    en: {
      title: 'Water Before Meals — The Simple Trick',
      summary: 'Drinking 500ml of water before eating can reduce calorie intake by 13%.',
      text: 'Studies show that drinking 500ml of water 20–30 minutes before a meal increases satiety and reduces how much you eat at that meal by an average of 13%. This works because the stomach sends fullness signals to the brain partly based on volume, not just calories. A glass of water before jollof rice goes a long way.',
    },
    fr: {
      title: "Eau avant les repas — l'astuce simple",
      summary: "Boire 500ml d'eau avant de manger réduit les calories ingérées de 13%.",
      text: "Des études montrent que boire 500ml d'eau 20 à 30 minutes avant un repas augmente la satiété et réduit l'apport calorique de 13% en moyenne. L'estomac envoie des signaux de satiété basés sur le volume, pas seulement les calories. Un verre avant le riz jollof fait beaucoup.",
    },
  },
  {
    id: 15,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&h=400&fit=crop',
    en: {
      title: 'Fonio — The Ancient Sahel Supergrain',
      summary: 'Naturally gluten-free with a low glycemic index and vital amino acids.',
      text: 'Fonio is one of Africa’s oldest cultivated cereals. Unlike white rice, it contains amino acids like methionine and cystine that aid liver function and muscle repair. It digests slowly, preventing the blood sugar spikes that trigger mid-day energy crashes.',
    },
    fr: {
      title: 'Le Fonio — le super-grain ancestral du Sahel',
      summary: 'Naturellement sans gluten avec un faible indice glycémique.',
      text: 'Le fonio est l’une des plus anciennes céréales d’Afrique. Contrairement au riz blanc, il regorge de méthionine et de cystine, des acides aminés essentiels à la réparation musculaire et au foie. Sa digestion lente évite les coups de fatigue.',
    },
  },
  {
    id: 16,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1609780447631-05b93e5a88ea?w=600&h=400&fit=crop',
    en: {
      title: 'Baobab Powder — 10x More Vitamin C than Oranges',
      summary: 'Add a spoonful to your water or smoothies for natural daily immunity.',
      text: 'Wild baobab fruit dries naturally on the branch before harvest. The pulp contains nearly 10 times more Vitamin C by weight than fresh oranges, plus abundant soluble prebiotic pectin that nourishes healthy gut microbes.',
    },
    fr: {
      title: 'La poudre de Baobab — 10x plus de Vitamine C',
      summary: 'Ajoutez une cuillère à vos boissons pour stimuler votre immunité.',
      text: 'La pulpe de fruit de baobab contient près de 10 fois plus de vitamine C que l’orange fraîche et regorge de fibres prébiotiques pectines pour fortifier la flore intestinale.',
    },
  },
  {
    id: 17,
    category: 'hydration',
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&h=400&fit=crop',
    en: {
      title: 'Tigernuts (Aya) — Resistant Starch Wonder',
      summary: 'A natural prebiotic tuber that boosts gut health and steady energy.',
      text: 'Despite their name, tigernuts (Ofio / Aki Hausa) are tiny root tubers. They are packed with resistant starch — a type of carbohydrate that bypasses stomach digestion and ferments in the colon, generating beneficial short-chain fatty acids.',
    },
    fr: {
      title: 'Le Souchet (Tigernuts) — trésor prébiotique',
      summary: 'Un tubercule naturel pour la digestion et une énergie constante.',
      text: 'Le souchet (Aya / Ofio) est un petit tubercule riche en amidon résistant. Il nourrit le microbiote intestinal et procure une satiété durable sans faire grimper l’insuline.',
    },
  },
  {
    id: 18,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1544025162-d76538b88ea2?w=600&h=400&fit=crop',
    en: {
      title: 'Giant Land Snail — The Ultra-Lean Protein',
      summary: 'Almost pure protein with zero saturated fat and rich iron reserves.',
      text: 'African giant land snails contain over 16g of protein per 100g with less than 1.5% fat. They provide more iron than beef and are packed with magnesium and selenium. Peppered or in vegetable stew, they are top-tier fitness food.',
    },
    fr: {
      title: 'L’Escargot géant — la protéine ultra-maigre',
      summary: 'Riche en protéines pures, sans graisses saturées et gorgé de fer.',
      text: 'L’escargot géant d’Afrique offre plus de 16g de protéines pour 100g avec seulement 1% de lipides. Il contient plus de fer assimilable que le bœuf et une excellente teneur en magnésium.',
    },
  },
  {
    id: 19,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop',
    en: {
      title: 'Bitter Leaf (Ewuro / Ndole) for Blood Sugar',
      summary: 'The bitter peptides stimulate bile flow and healthy glucose uptake.',
      text: 'The characteristic bitterness of Vernonia amygdalina comes from andrographolide and sesquiterpene lactones. These natural compounds stimulate insulin receptors and support bile production in the liver, helping clear dietary fats smoothly.',
    },
    fr: {
      title: 'Feuille Amère (Ewuro / Ndolé) et glycémie',
      summary: 'Les principes amers stimulent le foie et la régulation du glucose.',
      text: 'L’amertume naturelle de la feuille de vernonia contient des composés bioactifs qui améliorent la sensibilité à l’insuline et stimulent la production biliaire pour digérer les graisses.',
    },
  },
  {
    id: 20,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
    en: {
      title: 'Ukwa (African Breadfruit) — Potassium Power',
      summary: 'High potassium and plant sterols support healthy blood pressure.',
      text: 'Ukwa seeds are a nutritional powerhouse eaten across southeastern Nigeria. Rich in potassium, riboflavin, and complex carbs, a bowl of ukwa porridge supports arterial relaxation and supplies sustained athletic fuel.',
    },
    fr: {
      title: 'Ukwa (Fruit à pain africain) — force et potassium',
      summary: 'Riche en potassium et stérols végétaux pour la santé cardiaque.',
      text: 'Les graines d’Ukwa cuites en potage apportent des glucides complexes, du potassium et des vitamines B qui favorisent l’endurance et la détente artérielle.',
    },
  },
  {
    id: 21,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1565299543923-37de65d01a8c?w=600&h=400&fit=crop',
    en: {
      title: 'Moringa Leaf — Nature’s Micro-Nutrient Shield',
      summary: 'Dried moringa leaves contain 17x the calcium of milk.',
      text: 'Moringa oleifera grows across every West African ecosystem. Its dried leaf powder is dense with bioavailable calcium, zinc, iron, and quercetin. Stir half a teaspoon into your soup or water once daily to strengthen bone density and cellular repair.',
    },
    fr: {
      title: 'Feuilles de Moringa — bouclier micronutritionnel',
      summary: 'La poudre de moringa apporte 17 fois plus de calcium que le lait.',
      text: 'Le moringa est un arbre miracle d’Afrique de l’Ouest. Sa poudre séchée apporte du fer, du calcium et des antioxydants puissants pour revitaliser l’organisme au quotidien.',
    },
  },
  {
    id: 22,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop',
    en: {
      title: 'Dawadawa / Iru — The Probiotic Seasoning',
      summary: 'Fermented locust beans deliver deep umami along with gut probiotics.',
      text: 'Traditional fermentation of African locust beans produces Bacillus subtilis and lactic acid strains. Replacing industrial bouillon cubes with authentic Iru or Dawadawa slashes sodium while enriching your meal with microbiome-friendly enzymes.',
    },
    fr: {
      title: 'Soumbala / Dawadawa — le condiment probiotique',
      summary: 'Les graines de néré fermentées enrichissent le microbiote.',
      text: 'Le soumbala (dawadawa) traditionnel est issu de la fermentation des graines de néré. Il remplace avantageusement les cubes de bouillon industriels tout en apportant des enzymes digestives.',
    },
  },
  {
    id: 23,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&h=400&fit=crop',
    en: {
      title: 'Sorghum & Millet — Fuel Without Insulin Spikes',
      summary: 'Ancient cereal grains that deliver calm, sustained morning energy.',
      text: 'Millet and sorghum starches take up to 3 times longer to break down than refined flour. Starting your morning with kunu, bouillie de mil, or millet porridge keeps hunger hormones quiet until lunchtime.',
    },
    fr: {
      title: 'Sorgho et Mil — énergie stable sans pic d’insuline',
      summary: 'Céréales rustiques pour une matinée rassasiée et tonique.',
      text: 'Les glucides du mil et du sorgho se dégradent lentement. Une bouillie de mil matinale régule les hormones de la faim et maintient votre concentration jusqu’à midi.',
    },
  },
  {
    id: 24,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=600&h=400&fit=crop',
    en: {
      title: 'Red Palm Oil — Carotenoids in Moderation',
      summary: 'Virgin red palm oil contains tocotrienols that protect skin and eyes.',
      text: 'Unrefined virgin red palm oil gets its deep crimson hue from beta-carotene and lycopene. You do not need cups of it; just 1–2 teaspoons in your vegetable potage supplies your daily Vitamin A without overloading saturated calories.',
    },
    fr: {
      title: 'Huile de Palme Rouge — la juste mesure',
      summary: '1 à 2 cuillères suffisent pour faire le plein de caroténoïdes protecteurs.',
      text: 'L’huile de palme rouge brute non raffinée est l’une des plus riches sources naturelles de bêta-carotène. En petite quantité (1 à 2 cuillères à café), elle protège les yeux et la peau.',
    },
  },
  {
    id: 25,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&h=400&fit=crop',
    en: {
      title: 'Agbalumo / Udara — The Weight Loss Friendly Sweet',
      summary: 'Tangy local star apple satisfies sweet cravings with almost zero calories.',
      text: 'A medium African star apple (Agbalumo) has fewer than 35 calories but provides a massive burst of tart flavor and ascorbic acid. Eaten after lunch, it curbs the desire for sugary pastries or sodas.',
    },
    fr: {
      title: 'Pomme Étoile (Agbalumo / Udara) — douceur légère',
      summary: 'Moins de 35 calories pour combler une envie de sucre naturellement.',
      text: 'Le fruit de l’arbre à pomme étoile apporte une saveur acidulée intense avec très peu de calories. C’est l’alternative locale parfaite aux sodas et gâteaux après le repas.',
    },
  },
  {
    id: 26,
    category: 'hydration',
    image: 'https://images.unsplash.com/photo-1555529771-7888783a18d3?w=600&h=400&fit=crop',
    en: {
      title: 'Kunun Aya — Plant Milk Packed with Minerals',
      summary: 'Pure tigernut milk blended with ginger and cloves is dairy-free gold.',
      text: 'Homemade Kunun Aya is free of lactose, cholesterol, and artificial thickeners. The natural blend of tigernuts, dates, ginger, and cloves warms the digestion and provides potassium, calcium, and phosphorus in perfect liquid balance.',
    },
    fr: {
      title: 'Kunun Aya — le lait végétal aux épices',
      summary: 'Le lait de souchet maison avec gingembre et dattes sans lactose.',
      text: 'Le Kunun Aya maison ne contient ni lactose ni conservateurs. Les épices douces (gingembre, clou de girofle) activent le métabolisme tout en hydratant le corps.',
    },
  },
  {
    id: 27,
    category: 'diet',
    image: 'https://images.unsplash.com/photo-1536411396859-3b8dba6e8022?w=600&h=400&fit=crop',
    en: {
      title: 'Garden Eggs & Groundnut Paste — The Smart Snack',
      summary: 'Crisp, bitter-sweet African eggplants prevent mindless afternoon snacking.',
      text: 'African garden eggs (Solanum aethiopicum) are 92% water and loaded with nasunin, a powerful antioxidant that protects brain cell membranes. Dipping crunchy garden eggs into roasted groundnut paste gives an unbeatable balance of crunch, healthy fat, and satiety.',
    },
    fr: {
      title: 'Aubergines locales & pâte d’arachide — l’encas malin',
      summary: '92% d’eau et un antioxydant puissant qui protège vos cellules.',
      text: 'Les petites aubergines locales africaines sont gorgées d’eau et de fibres. Trempées dans une pointe de pâte d’arachide, elles forment un coupe-faim sain et croquant pour l’après-midi.',
    },
  },
  {
    id: 28,
    category: 'hydration',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop',
    en: {
      title: 'Late Night Swallows & Sleep Disruption',
      summary: 'Why eating heavy pounded yam within 2 hours of bedtime harms rest.',
      text: 'Digestive tract activity requires high blood flow and raises internal core temperature — directly conflicting with the natural temperature drop required for deep restorative sleep. Finish dense swallow meals by 7:30 PM, or choose a lighter option if dining late.',
    },
    fr: {
      title: 'Dîners tardifs et sommeil réparateur',
      summary: 'Pourquoi manger lourd tard le soir nuit à la récupération.',
      text: 'La digestion lourde augmente la température corporelle et bloque les cycles de sommeil profond. Terminez vos repas copieux avant 19h30 pour permettre à votre corps de brûler les graisses durant la nuit.',
    },
  },
]

// ─── Daily rotation helper ─────────────────────────────────────────────────────
// Rotates through distinct sets based on the local calendar day
export function getDailyTips() {
  const now = new Date()
  const dayIndex = now.getDay() // 0 to 6 (Sun to Sat)
  const dateNum = now.getDate()
  
  // Deterministic daily offset: changes every single day so each day feels fresh
  const poolSize = ALL_TIPS.length
  const offset = (dayIndex * 4 + dateNum) % poolSize
  const daily = []
  for (let i = 0; i < 10; i++) {
    daily.push(ALL_TIPS[(offset + i) % poolSize])
  }
  return daily
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function WellnessTips() {
  const navigate = useNavigate()
  const { language } = useUiStore()
  const { toggle, isBookmarked } = useBookmarkStore()
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState('all')
  const [expandedTip, setExpandedTip] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // API state
  const [apiTips, setApiTips] = useState(null) // null = not yet fetched
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [apiSource, setApiSource] = useState('local') // 'groq' | 'cache' | 'local'

  const currentCulture = language === 'fr' ? 'fr' : 'en'

  // Stable daily fallback set
  const dailyFallback = useMemo(() => getDailyTips(), [])

  // Fetch from backend on mount
  useEffect(() => {
    const fetchTips = async () => {
      setSyncing(true)
      try {
        const now = new Date()
        const y = now.getFullYear()
        const m = String(now.getMonth() + 1).padStart(2, '0')
        const d = String(now.getDate()).padStart(2, '0')
        const dateStr = `${y}-${m}-${d}`
        const res = await axios.get(`/api/wellness/tips?date=${dateStr}`, { withCredentials: true })
        if (res.data.success && res.data.data?.length > 0) {
          // Map Groq-generated articles into the card shape
          const mapped = res.data.data.map((a, i) => ({
            id: `ai-${i}`,
            category: a.category || 'nutrition',
            image: a.image,
            en: {
              title:   a.en?.title   || a.title   || 'Wellness Tip',
              summary: a.en?.summary || a.summary || '',
              text:    a.en?.fullText || a.en?.text || a.fullText || a.summary || '',
            },
            fr: {
              title:   a.fr?.title   || a.en?.title   || a.title   || 'Conseil Bien-être',
              summary: a.fr?.summary || a.en?.summary || a.summary || '',
              text:    a.fr?.fullText || a.fr?.text || a.en?.fullText || a.fullText || '',
            },
            source: a.source || 'MeCal AI',
            url: null,
          }))

          setApiTips(mapped)
          setApiSource(res.data.source) // 'groq' or 'cache'
        }
      } catch {
        // Silently fall back to local articles — no error shown to user
      } finally {
        setSyncing(false)
      }
    }
    fetchTips()
  }, [])

  // Use API tips if available, otherwise use hardcoded daily rotation
  const activeTips = apiTips ?? dailyFallback

  const filtered = activeTips.filter((tip) => {
    const matchesCategory = activeCategory === 'all' || tip.category === activeCategory
    const content = tip[currentCulture] || tip.en
    const matchesSearch =
      !searchQuery ||
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.summary.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleExpand = (id, e) => {
    if (e.target.closest('button')) return
    setExpandedTip(expandedTip === id ? null : id)
  }

  return (
    <div className={`fade-in ${styles.container}`}>
      {/* Header */}
      <div className={styles.headerSection}>
        <header className={styles.header}>
          <div className={styles.backRow}>
            <button onClick={() => navigate('/home')} className={styles.backBtn} aria-label="Back">
              <ArrowLeft size={22} />
            </button>
          </div>
          <div className={styles.searchRow}>
            <div className={styles.searchBar}>
              <Search size={15} color="var(--color-text-secondary)" />
              <input
                type="text"
                placeholder={currentCulture === 'fr' ? 'Rechercher un article…' : 'Search articles…'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className={styles.savedBtn}
              onClick={() => {
                setSyncing(true)
                const shuffled = [...ALL_TIPS].sort(() => Math.random() - 0.5).slice(0, 10)
                setApiTips(shuffled)
                setApiSource('local')
                setTimeout(() => setSyncing(false), 500)
              }}
              title={currentCulture === 'fr' ? 'Changer les articles' : 'Shuffle Articles'}
              aria-label="Refresh articles"
            >
              <RefreshCw size={18} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button
              className={styles.savedBtn}
              onClick={() => navigate('/saved-tips')}
              aria-label="Saved articles"
            >
              <BookmarkCheck size={20} />
            </button>
          </div>
        </header>

        {/* Page subtitle */}
        <div className={styles.pageTitle}>
          <Sparkles size={16} className={styles.sparkIcon} />
          <span>
            {apiSource === 'groq'
              ? (currentCulture === 'fr' ? "Générés par Groq AI aujourd'hui" : 'Fresh from Groq AI today')
              : apiSource === 'cache'
                ? (currentCulture === 'fr' ? "Articles d'aujourd'hui" : "Today's articles")
                : (currentCulture === 'fr' ? "10 articles d'aujourd'hui" : "Today's 10 Articles")}
          </span>
          {syncing && <RefreshCw size={13} className={styles.loadingSpinIcon} />}
        </div>
      </div>

      {/* Category tabs */}
      <div className={styles.categoriesBar}>
        {[
          { key: 'all', en: 'All', fr: 'Tous' },
          { key: 'diet', en: 'Nutrition', fr: 'Alimentation' },
          { key: 'hydration', en: 'Hydration', fr: 'Hydratation' },
        ].map((cat) => (
          <button
            key={cat.key}
            className={`${styles.categoryTab} ${activeCategory === cat.key ? styles.activeTab : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {currentCulture === 'fr' ? cat.fr : cat.en}
          </button>
        ))}
      </div>

      {/* Articles list */}
      <div className={styles.tipsList}>
        {/* Loading skeleton */}
        {loading && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonImage} />
            <div className={styles.skeletonContent}>
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLineShort} />
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className={styles.noResults}>
            <p>{currentCulture === 'fr' ? 'Aucun article trouvé.' : 'No articles found.'}</p>
          </div>
        )}

        {!loading && filtered.map((tip) => {
          const content = tip[currentCulture] || tip.en
          const isExpanded = expandedTip === tip.id
          const saved = isBookmarked(tip.id)

          return (
            <div
              key={tip.id}
              className={`${styles.mediaCard} ${isExpanded ? styles.expandedMediaCard : ''}`}
              onClick={(e) => toggleExpand(tip.id, e)}
            >
              {/* Topic image */}
              <div className={styles.mediaImageContainer}>
                <img
                  src={tip.image}
                  alt={content.title}
                  className={styles.mediaImage}
                  loading="lazy"
                />
                <div className={styles.imageGradient} />

                {/* Bookmark button */}
                <button
                  className={`${styles.bookmarkBtn} ${saved ? styles.bookmarkActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(tip.id)
                  }}
                  aria-label={saved
                    ? (currentCulture === 'fr' ? 'Retirer le signet' : 'Remove bookmark')
                    : (currentCulture === 'fr' ? 'Sauvegarder cet article' : 'Bookmark article')}
                >
                  {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
                </button>

                {/* Category badge */}
                <span className={`${styles.catBadge} ${tip.category === 'hydration' ? styles.catHydration : styles.catDiet}`}>
                  {tip.category === 'hydration'
                    ? (currentCulture === 'fr' ? 'Hydratation' : 'Hydration')
                    : (currentCulture === 'fr' ? 'Nutrition' : 'Nutrition')}
                </span>

                {/* AI source badge (e.g. "MeCal AI") */}
                {tip.source && (
                  <span className={styles.sourceBadge}>{tip.source}</span>
                )}
              </div>

              {/* Card content */}
              <div className={styles.mediaCardContent}>
                <h3 className={styles.mediaCardTitle}>{content.title}</h3>
                <p className={styles.mediaCardSummary}>{content.summary}</p>

                {isExpanded && (
                  <div className={styles.expandedTextWrapper}>
                    <p className={styles.fullMediaText}>{content.text}</p>
                    {tip.url && (
                      <a
                        href={tip.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.readFullLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {currentCulture === 'fr' ? "Lire l'article complet →" : 'Read full article →'}
                      </a>
                    )}
                  </div>
                )}

                <span className={styles.readMoreTag}>
                  {isExpanded
                    ? (currentCulture === 'fr' ? '▲ Réduire' : '▲ Show less')
                    : (currentCulture === 'fr' ? '▼ Lire la suite' : '▼ Read more')}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

