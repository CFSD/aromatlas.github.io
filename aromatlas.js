// Hierarchical definition of aroma families, groups and individual labels.
// This module is consumed by the Aromatlas palette to display
// categories and search through all available aromas. The structure
// mirrors the original aromatlas.json file, but wrapped in a JS
// module to avoid CORS issues when loaded locally.

export default {
  "FRUITÉ": {
    _fam: "fruite",
    "Agrumes": ["citron","citron vert","orange","mandarine","pamplemousse"],
    "Fruits tropicaux": ["ananas","mangue","banane","papaye","fruit de la passion","melon"],
    "Fruits à pépins": ["pomme","pomme verte","poire","coing"],
    "Fruits à noyau": ["pêche","abricot","prune","mirabelle"],
    "Baies rouges": ["fraise","framboise","cassis","mûre","myrtille"],
    "Fruits secs": ["raisin sec","pruneau","figue sèche","abricot sec","dattes"]
  },
  "FLORAL": {
    _fam: "floral",
    "Notes florales": ["fleur d’oranger","rose","bruyère","géranium","lavande","violette"]
  },
  "HERBACÉ": {
    _fam: "herbace",
    "Notes herbacées": ["herbe coupée","menthe","eucalyptus","genévrier","feuille de tabac","foin","thym","pin"]
  },
  "CÉRÉALE": {
    _fam: "cereale",
    "Torréfié": ["biscuit","toast","café","cacao","chocolat"],
    "Levures": ["pain frais","pâte levée","brioche","yaourt/fromage frais"]
  },
  "QUEUE DE DISTILLATION": {
    _fam: "queue",
    "Queue de distillation": ["huile minérale","cire de bougie / paraffine","beurre rance","savon","métallique","cuir","sac de jute"]
  },
  "TOURBÉ": {
    _fam: "tourbe",
    "Tourbé": ["fumé","tourbe","terre humide","mousse d’arbre","médicinal","vieux bandage","bacon","goudron","caoutchouc","kérosène","silex","poisson / fruits de mer","iode","algue","soufre"]
  },
  "ÉLEVAGE EN FÛT DE CHÊNE": {
    _fam: "elevage",
    "Boisé": ["chêne","cèdre","bois de santal","vanille","caramel","miel"],
    "Épicé": ["cannelle","girofle","gingembre","poivre","noix de muscade","cardamome"],
    "Vineux": ["sherry / xérès","madère","porto","vin rouge","sauternes"],
    "Noix": ["noix","noisette","amande","noix de coco","pralin","nougat"]
  }
};
