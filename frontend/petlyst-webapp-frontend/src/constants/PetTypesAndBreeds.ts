export interface PetBreed {
  id: string;
  name: string;
}

export interface PetType {
  id: string;
  name: string;
  breeds: PetBreed[];
}

const PET_TYPES_AND_BREEDS: PetType[] = [
  {
    id: "dog",
    name: "Dog",
    breeds: [
      { id: "labrador", name: "Labrador Retriever" },
      { id: "german_shepherd", name: "German Shepherd" },
      { id: "bulldog", name: "Bulldog" },
      { id: "beagle", name: "Beagle" },
      { id: "poodle", name: "Poodle" },
      { id: "rottweiler", name: "Rottweiler" },
      { id: "yorkshire_terrier", name: "Yorkshire Terrier" },
      { id: "boxer", name: "Boxer" },
      { id: "dachshund", name: "Dachshund" },
      { id: "shih_tzu", name: "Shih Tzu" },
      { id: "golden_retriever", name: "Golden Retriever" },
      { id: "siberian_husky", name: "Siberian Husky" },
      { id: "chihuahua", name: "Chihuahua" },
      { id: "great_dane", name: "Great Dane" },
      { id: "doberman", name: "Doberman Pinscher" },
      { id: "border_collie", name: "Border Collie" },
      { id: "pug", name: "Pug" },
      { id: "french_bulldog", name: "French Bulldog" },
      { id: "mixed_breed_dog", name: "Mixed Breed" },
      { id: "other_dog", name: "Other" }
    ]
  },
  {
    id: "cat",
    name: "Cat",
    breeds: [
      { id: "persian", name: "Persian" },
      { id: "maine_coon", name: "Maine Coon" },
      { id: "siamese", name: "Siamese" },
      { id: "ragdoll", name: "Ragdoll" },
      { id: "bengal", name: "Bengal" },
      { id: "abyssinian", name: "Abyssinian" },
      { id: "british_shorthair", name: "British Shorthair" },
      { id: "sphynx", name: "Sphynx" },
      { id: "scottish_fold", name: "Scottish Fold" },
      { id: "norwegian_forest", name: "Norwegian Forest" },
      { id: "birman", name: "Birman" },
      { id: "russian_blue", name: "Russian Blue" },
      { id: "turkish_angora", name: "Turkish Angora" },
      { id: "turkish_van", name: "Turkish Van" },
      { id: "american_shorthair", name: "American Shorthair" },
      { id: "mixed_breed_cat", name: "Mixed Breed" },
      { id: "other_cat", name: "Other" }
    ]
  },
  {
    id: "bird",
    name: "Bird",
    breeds: [
      { id: "canary", name: "Canary" },
      { id: "parakeet", name: "Parakeet/Budgerigar" },
      { id: "cockatiel", name: "Cockatiel" },
      { id: "african_grey", name: "African Grey Parrot" },
      { id: "macaw", name: "Macaw" },
      { id: "cockatoo", name: "Cockatoo" },
      { id: "lovebird", name: "Lovebird" },
      { id: "finch", name: "Finch" },
      { id: "amazon_parrot", name: "Amazon Parrot" },
      { id: "conure", name: "Conure" },
      { id: "other_bird", name: "Other" }
    ]
  },
  {
    id: "fish",
    name: "Fish",
    breeds: [
      { id: "goldfish", name: "Goldfish" },
      { id: "betta", name: "Betta" },
      { id: "guppy", name: "Guppy" },
      { id: "tetra", name: "Tetra" },
      { id: "angelfish", name: "Angelfish" },
      { id: "discus", name: "Discus" },
      { id: "koi", name: "Koi" },
      { id: "molly", name: "Molly" },
      { id: "swordtail", name: "Swordtail" },
      { id: "platy", name: "Platy" },
      { id: "barb", name: "Barb" },
      { id: "other_fish", name: "Other" }
    ]
  },
  {
    id: "reptile",
    name: "Reptile",
    breeds: [
      { id: "bearded_dragon", name: "Bearded Dragon" },
      { id: "ball_python", name: "Ball Python" },
      { id: "leopard_gecko", name: "Leopard Gecko" },
      { id: "corn_snake", name: "Corn Snake" },
      { id: "turtle", name: "Turtle" },
      { id: "tortoise", name: "Tortoise" },
      { id: "chameleon", name: "Chameleon" },
      { id: "iguana", name: "Iguana" },
      { id: "boa", name: "Boa Constrictor" },
      { id: "other_reptile", name: "Other" }
    ]
  },
  {
    id: "small_mammal",
    name: "Small Mammal",
    breeds: [
      { id: "rabbit", name: "Rabbit" },
      { id: "hamster", name: "Hamster" },
      { id: "guinea_pig", name: "Guinea Pig" },
      { id: "rat", name: "Rat" },
      { id: "mouse", name: "Mouse" },
      { id: "ferret", name: "Ferret" },
      { id: "chinchilla", name: "Chinchilla" },
      { id: "hedgehog", name: "Hedgehog" },
      { id: "sugar_glider", name: "Sugar Glider" },
      { id: "gerbil", name: "Gerbil" },
      { id: "other_small_mammal", name: "Other" }
    ]
  },
  {
    id: "other",
    name: "Other",
    breeds: [
      { id: "horse", name: "Horse" },
      { id: "pony", name: "Pony" },
      { id: "donkey", name: "Donkey" },
      { id: "pig", name: "Pig" },
      { id: "goat", name: "Goat" },
      { id: "sheep", name: "Sheep" },
      { id: "chicken", name: "Chicken" },
      { id: "duck", name: "Duck" },
      { id: "exotic", name: "Exotic Pet" },
      { id: "other_pet", name: "Other" }
    ]
  }
];

export default PET_TYPES_AND_BREEDS;

export const getPetTypeById = (id: string): PetType | undefined => {
  return PET_TYPES_AND_BREEDS.find(type => type.id === id);
};

export const getPetTypeByName = (name: string): PetType | undefined => {
  return PET_TYPES_AND_BREEDS.find(type => type.name === name);
};

export const getBreedsByPetType = (petTypeId: string): PetBreed[] => {
  const petType = getPetTypeById(petTypeId);
  return petType ? petType.breeds : [];
};

export const getBreedsByPetTypeName = (petTypeName: string): PetBreed[] => {
  const petType = getPetTypeByName(petTypeName);
  return petType ? petType.breeds : [];
}; 