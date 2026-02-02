/**
 * Dominican Republic administrative divisions data.
 * Includes provincias, municipios, and distritos municipales.
 */

export interface Municipio {
  municipio: string;
  distritosMunicipales: string[];
}

export interface Provincia {
  provincia: string;
  municipios: Municipio[];
}

/**
 * Complete list of Dominican Republic provinces with their municipalities
 * and municipal districts.
 */
export const PROVINCIAS_RD: Provincia[] = [
  {
    "provincia": "Distrito Nacional",
    "municipios": [
      { "municipio": "Distrito Nacional", "distritosMunicipales": [] }
    ]
  },
  {
    "provincia": "Azua",
    "municipios": [
      { "municipio": "Azua de Compostela", "distritosMunicipales": ["Barreras", "Barro Arriba", "Clavellina", "Emma Balaguer Viuda Vallejo", "Las Barías-La Estancia", "Las Lomas", "Los Jovillos", "Puerto Viejo"] },
      { "municipio": "Estebanía", "distritosMunicipales": [] },
      { "municipio": "Guayabal", "distritosMunicipales": [] },
      { "municipio": "Las Charcas", "distritosMunicipales": ["Hatillo", "Palmar de Ocoa"] },
      { "municipio": "Las Yayas de Viajama", "distritosMunicipales": ["Villarpando", "Hato Nuevo-Cortés"] },
      { "municipio": "Padre Las Casas", "distritosMunicipales": ["La Siembra", "Las Lagunas", "Los Fríos"] },
      { "municipio": "Peralta", "distritosMunicipales": [] },
      { "municipio": "Pueblo Viejo", "distritosMunicipales": ["El Rosario"] },
      { "municipio": "Sabana Yegua", "distritosMunicipales": ["Proyecto 4", "Ganadero", "Proyecto 2-C"] },
      { "municipio": "Tábara Arriba", "distritosMunicipales": ["Amiama Gómez", "Los Toros", "Tábara Abajo"] }
    ]
  },
  {
    "provincia": "Baoruco",
    "municipios": [
      { "municipio": "Neiba", "distritosMunicipales": ["El Palmar"] },
      { "municipio": "Galván", "distritosMunicipales": ["El Salado"] },
      { "municipio": "Los Ríos", "distritosMunicipales": ["Las Clavellinas"] },
      { "municipio": "Tamayo", "distritosMunicipales": ["Cabeza de Toro", "Mena", "Monserrat", "Santa Bárbara-El 6", "Santana", "Uvilla"] },
      { "municipio": "Villa Jaragua", "distritosMunicipales": [] }
    ]
  },
  {
    "provincia": "Barahona",
    "municipios": [
      { "municipio": "Barahona", "distritosMunicipales": ["El Cachón", "La Guázara", "Villa Central"] },
      { "municipio": "Cabral", "distritosMunicipales": [] },
      { "municipio": "El Peñón", "distritosMunicipales": [] },
      { "municipio": "Enriquillo", "distritosMunicipales": ["Arroyo Dulce"] },
      { "municipio": "Fundación", "distritosMunicipales": ["Pescadería"] },
      { "municipio": "Jaquimeyes", "distritosMunicipales": ["Palo Alto"] },
      { "municipio": "La Ciénaga", "distritosMunicipales": ["Bahoruco"] },
      { "municipio": "Las Salinas", "distritosMunicipales": [] },
      { "municipio": "Paraíso", "distritosMunicipales": ["Los Patos"] },
      { "municipio": "Polo", "distritosMunicipales": [] },
      { "municipio": "Vicente Noble", "distritosMunicipales": ["Canoa", "Fondo Negro", "Quita Coraza"] }
    ]
  },
  {
    "provincia": "Dajabón",
    "municipios": [
      { "municipio": "Dajabón", "distritosMunicipales": ["Cañongo"] },
      { "municipio": "El Pino", "distritosMunicipales": ["Manuel Bueno"] },
      { "municipio": "Loma de Cabrera", "distritosMunicipales": ["Capotillo", "Santiago de la Cruz"] },
      { "municipio": "Partido", "distritosMunicipales": [] },
      { "municipio": "Restauración", "distritosMunicipales": [] }
    ]
  },
  {
    "provincia": "Duarte",
    "municipios": [
      { "municipio": "San Francisco de Macorís", "distritosMunicipales": ["Cenoví", "Jaya", "La Peña", "Presidente Don Antonio Guzmán"] },
      { "municipio": "Arenoso", "distritosMunicipales": ["Aguacate", "Las Coles"] },
      { "municipio": "Castillo", "distritosMunicipales": [] },
      { "municipio": "Eugenio María de Hostos", "distritosMunicipales": ["Sabana Grande"] },
      { "municipio": "Las Guáranas", "distritosMunicipales": [] },
      { "municipio": "Pimentel", "distritosMunicipales": [] },
      { "municipio": "Villa Riva", "distritosMunicipales": ["Agua Santa del Yuna", "Barraquito", "Cristo Rey de Guaraguao", "Las Táranas"] }
    ]
  },
  {
    "provincia": "El Seibo",
    "municipios": [
      { "municipio": "El Seibo", "distritosMunicipales": ["Pedro Sánchez", "San Francisco-Vicentillo", "Santa Lucía"] },
      { "municipio": "Miches", "distritosMunicipales": ["El Cedro", "La Gina"] }
    ]
  },
  {
    "provincia": "Elías Piña",
    "municipios": [
      { "municipio": "Comendador", "distritosMunicipales": ["Guayabo", "Sabana Larga"] },
      { "municipio": "Bánica", "distritosMunicipales": ["Sabana Cruz", "Sabana Higüero"] },
      { "municipio": "El Llano", "distritosMunicipales": ["Guanito"] },
      { "municipio": "Hondo Valle", "distritosMunicipales": ["Rancho de la Guardia"] },
      { "municipio": "Juan Santiago", "distritosMunicipales": [] },
      { "municipio": "Pedro Santana", "distritosMunicipales": ["Río Limpio"] }
    ]
  },
  {
    "provincia": "Espaillat",
    "municipios": [
      { "municipio": "Moca", "distritosMunicipales": ["Canca La Reina", "El Higüerito", "José Contreras", "Juan López", "La Ortega", "Las Lagunas", "Monte de la Jagua", "San Víctor"] },
      { "municipio": "Cayetano Germosén", "distritosMunicipales": [] },
      { "municipio": "Gaspar Hernández", "distritosMunicipales": ["Joba Arriba", "Veragua", "Villa Magante"] },
      { "municipio": "Jamao al Norte", "distritosMunicipales": [] }
    ]
  },
  {
    "provincia": "Hato Mayor",
    "municipios": [
      { "municipio": "Hato Mayor del Rey", "distritosMunicipales": ["Guayabo Dulce", "Mata Palacio", "Yerba Buena"] },
      { "municipio": "El Valle", "distritosMunicipales": [] },
      { "municipio": "Sabana de la Mar", "distritosMunicipales": ["Elupina Cordero de Las Cañitas"] }
    ]
  },
  {
    "provincia": "Hermanas Mirabal",
    "municipios": [
      { "municipio": "Salcedo", "distritosMunicipales": ["Jamao Afuera"] },
      { "municipio": "Tenares", "distritosMunicipales": ["Blanco"] },
      { "municipio": "Villa Tapia", "distritosMunicipales": [] }
    ]
  },
  {
    "provincia": "Independencia",
    "municipios": [
      { "municipio": "Jimaní", "distritosMunicipales": ["Boca de Cachón", "El Limón"] },
      { "municipio": "Cristóbal", "distritosMunicipales": ["Batey 8"] },
      { "municipio": "Duvergé", "distritosMunicipales": ["Vengan a Ver"] },
      { "municipio": "La Descubierta", "distritosMunicipales": [] },
      { "municipio": "Mella", "distritosMunicipales": ["La Colonia"] },
      { "municipio": "Postrer Río", "distritosMunicipales": ["Guayabal"] }
    ]
  },
  {
    "provincia": "La Altagracia",
    "municipios": [
      { "municipio": "Higüey", "distritosMunicipales": ["La Otra Banda", "Lagunas de Nisibón", "Verón-Punta Cana"] },
      { "municipio": "San Rafael del Yuma", "distritosMunicipales": ["Bayahibe", "Boca de Yuma"] }
    ]
  },
  {
    "provincia": "La Romana",
    "municipios": [
      { "municipio": "La Romana", "distritosMunicipales": ["Caleta"] },
      { "municipio": "Guaymate", "distritosMunicipales": [] },
      { "municipio": "Villa Hermosa", "distritosMunicipales": ["Cumayasa"] }
    ]
  },
  {
    "provincia": "La Vega",
    "municipios": [
      { "municipio": "La Concepción de La Vega", "distritosMunicipales": ["El Ranchito", "Río Verde Arriba"] },
      { "municipio": "Constanza", "distritosMunicipales": ["La Sabina", "Tireo"] },
      { "municipio": "Jarabacoa", "distritosMunicipales": ["Buena Vista", "Manabao"] },
      { "municipio": "Jima Abajo", "distritosMunicipales": ["Rincón"] }
    ]
  },
  {
    "provincia": "María Trinidad Sánchez",
    "municipios": [
      { "municipio": "Nagua", "distritosMunicipales": ["Arroyo al Medio", "Las Gordas", "San José de Matanzas"] },
      { "municipio": "Cabrera", "distritosMunicipales": ["Arroyo Salado", "La Entrada"] },
      { "municipio": "El Factor", "distritosMunicipales": ["El Pozo"] },
      { "municipio": "Río San Juan", "distritosMunicipales": [] }
    ]
  },
  {
    "provincia": "Monseñor Nouel",
    "municipios": [
      { "municipio": "Bonao", "distritosMunicipales": ["Arroyo Toro-Masipedro", "La Salvia-Los Quemados", "Jayaco", "Juma Bejucal", "Sabana del Puerto"] },
      { "municipio": "Maimón", "distritosMunicipales": [] },
      { "municipio": "Piedra Blanca", "distritosMunicipales": ["Juan Adrián", "Villa Sonador"] }
    ]
  },
  {
    "provincia": "Montecristi",
    "municipios": [
      { "municipio": "Montecristi", "distritosMunicipales": [] },
      { "municipio": "Castañuela", "distritosMunicipales": ["Palo Verde"] },
      { "municipio": "Guayubín", "distritosMunicipales": ["Cana Chapetón", "Hatillo Palma", "Villa Elisa"] },
      { "municipio": "Las Matas de Santa Cruz", "distritosMunicipales": [] },
      { "municipio": "Pepillo Salcedo", "distritosMunicipales": [] },
      { "municipio": "Villa Vásquez", "distritosMunicipales": [] }
    ]
  },
  {
    "provincia": "Monte Plata",
    "municipios": [
      { "municipio": "Monte Plata", "distritosMunicipales": ["Boyá", "Chirino", "Don Juan"] },
      { "municipio": "Bayaguana", "distritosMunicipales": [] },
      { "municipio": "Peralvillo", "distritosMunicipales": [] },
      { "municipio": "Sabana Grande de Boyá", "distritosMunicipales": ["Gonzalo", "Majagual"] },
      { "municipio": "Yamasá", "distritosMunicipales": ["Los Botados"] }
    ]
  },
  {
    "provincia": "Pedernales",
    "municipios": [
      { "municipio": "Pedernales", "distritosMunicipales": ["José Francisco Peña Gómez", "Juancho"] },
      { "municipio": "Oviedo", "distritosMunicipales": [] }
    ]
  },
  {
    "provincia": "Peravia",
    "municipios": [
      { "municipio": "Baní", "distritosMunicipales": ["Catalina", "El Carretón", "El Limonal", "Las Barías", "Matanzas", "Paya", "Sabana Buey", "Villa Fundación", "Villa Sombrero"] },
      { "municipio": "Nizao", "distritosMunicipales": ["Pizarrete", "Santana"] }
    ]
  },
  {
    "provincia": "Puerto Plata",
    "municipios": [
      { "municipio": "Puerto Plata", "distritosMunicipales": ["Maimón", "Yásica Arriba"] },
      { "municipio": "Altamira", "distritosMunicipales": ["Río Grande"] },
      { "municipio": "Guananico", "distritosMunicipales": [] },
      { "municipio": "Imbert", "distritosMunicipales": [] },
      { "municipio": "Los Hidalgos", "distritosMunicipales": ["Navas"] },
      { "municipio": "Luperón", "distritosMunicipales": ["Belloso", "Estrecho", "La Isabela"] },
      { "municipio": "Sosúa", "distritosMunicipales": ["Cabarete", "Sabaneta de Yásica"] },
      { "municipio": "Villa Isabela", "distritosMunicipales": ["Estero Hondo", "Gualete", "La Jaiba"] },
      { "municipio": "Villa Montellano", "distritosMunicipales": [] }
    ]
  },
  {
    "provincia": "Samaná",
    "municipios": [
      { "municipio": "Samaná", "distritosMunicipales": ["Arroyo Barril", "El Limón", "Las Galeras"] },
      { "municipio": "Las Terrenas", "distritosMunicipales": [] },
      { "municipio": "Sánchez", "distritosMunicipales": [] }
    ]
  },
  {
    "provincia": "San Cristóbal",
    "municipios": [
      { "municipio": "San Cristóbal", "distritosMunicipales": ["Hato Damas"] },
      { "municipio": "Bajos de Haina", "distritosMunicipales": ["El Carril"] },
      { "municipio": "Cambita Garabito", "distritosMunicipales": ["Cambita El Pueblecito"] },
      { "municipio": "Los Cacaos", "distritosMunicipales": [] },
      { "municipio": "Sabana Grande de Palenque", "distritosMunicipales": [] },
      { "municipio": "San Gregorio de Nigua", "distritosMunicipales": [] },
      { "municipio": "Villa Altagracia", "distritosMunicipales": ["La Cuchilla", "Medina", "San José del Puerto"] },
      { "municipio": "Yaguate", "distritosMunicipales": [] }
    ]
  },
  {
    "provincia": "San José de Ocoa",
    "municipios": [
      { "municipio": "San José de Ocoa", "distritosMunicipales": ["El Naranjal", "El Pinar", "La Ciénaga", "Nizao-Las Auyamas"] },
      { "municipio": "Rancho Arriba", "distritosMunicipales": [] },
      { "municipio": "Sabana Larga", "distritosMunicipales": [] }
    ]
  },
  {
    "provincia": "San Juan",
    "municipios": [
      { "municipio": "San Juan de la Maguana", "distritosMunicipales": ["El Rosario", "Guanito", "Hato del Padre", "Hato Nuevo", "La Jagua", "Las Charcas de María Nova", "Pedro Corto", "Sabana Alta", "Sabaneta"] },
      { "municipio": "Bohechío", "distritosMunicipales": ["Arroyo Cano", "Yaque"] },
      { "municipio": "El Cercado", "distritosMunicipales": ["Batista", "Derrumbadero"] },
      { "municipio": "Juan de Herrera", "distritosMunicipales": ["Jínova"] },
      { "municipio": "Las Matas de Farfán", "distritosMunicipales": ["Carrera de Yegua", "Matayaya"] },
      { "municipio": "Vallejuelo", "distritosMunicipales": ["Jorjillo"] }
    ]
  },
  {
    "provincia": "San Pedro de Macorís",
    "municipios": [
      { "municipio": "San Pedro de Macorís", "distritosMunicipales": [] },
      { "municipio": "Consuelo", "distritosMunicipales": [] },
      { "municipio": "Guayacanes", "distritosMunicipales": [] },
      { "municipio": "Quisqueya", "distritosMunicipales": [] },
      { "municipio": "Ramón Santana", "distritosMunicipales": [] },
      { "municipio": "San José de Los Llanos", "distritosMunicipales": ["El Puerto", "Gautier"] }
    ]
  },
  {
    "provincia": "Sánchez Ramírez",
    "municipios": [
      { "municipio": "Cotuí", "distritosMunicipales": ["Caballero", "Comedero Arriba", "Quita Sueño"] },
      { "municipio": "Cevicos", "distritosMunicipales": ["La Cueva", "Platanal"] },
      { "municipio": "Fantino", "distritosMunicipales": [] },
      { "municipio": "La Mata", "distritosMunicipales": ["Angelina", "La Bija", "Hernando Alonzo"] }
    ]
  },
  {
    "provincia": "Santiago",
    "municipios": [
      { "municipio": "Santiago", "distritosMunicipales": ["Baitoa", "Hato del Yaque", "La Canela", "Pedro García", "San Francisco de Jacagua"] },
      { "municipio": "Bisonó", "distritosMunicipales": [] },
      { "municipio": "Jánico", "distritosMunicipales": ["El Caimito", "Juncalito"] },
      { "municipio": "Licey al Medio", "distritosMunicipales": ["Las Palomas"] },
      { "municipio": "Puñal", "distritosMunicipales": ["Canabacoa", "Guayabal"] },
      { "municipio": "Sabana Iglesia", "distritosMunicipales": [] },
      { "municipio": "San José de las Matas", "distritosMunicipales": ["El Rubio", "La Cuesta", "Las Placetas"] },
      { "municipio": "Tamboril", "distritosMunicipales": ["Canca La Piedra"] },
      { "municipio": "Villa González", "distritosMunicipales": ["El Limón", "Palmar Arriba"] }
    ]
  },
  {
    "provincia": "Santiago Rodríguez",
    "municipios": [
      { "municipio": "San Ignacio de Sabaneta", "distritosMunicipales": [] },
      { "municipio": "Los Almácigos", "distritosMunicipales": [] },
      { "municipio": "Monción", "distritosMunicipales": [] }
    ]
  },
  {
    "provincia": "Santo Domingo",
    "municipios": [
      { "municipio": "Santo Domingo Este", "distritosMunicipales": ["San Luis"] },
      { "municipio": "Boca Chica", "distritosMunicipales": ["La Caleta"] },
      { "municipio": "Los Alcarrizos", "distritosMunicipales": ["Palmarejo-Villa Linda", "Pantoja"] },
      { "municipio": "Pedro Brand", "distritosMunicipales": ["La Cuaba", "La Guáyiga"] },
      { "municipio": "San Antonio de Guerra", "distritosMunicipales": ["Hato Viejo"] },
      { "municipio": "Santo Domingo Norte", "distritosMunicipales": ["La Victoria"] },
      { "municipio": "Santo Domingo Oeste", "distritosMunicipales": [] }
    ]
  },
  {
    "provincia": "Valverde",
    "municipios": [
      { "municipio": "Mao", "distritosMunicipales": ["Ámina", "Guatapanal", "Jaibón (Pueblo Nuevo)"] },
      { "municipio": "Esperanza", "distritosMunicipales": ["Boca de Mao", "Jicomé", "Maizal", "Paradero"] },
      { "municipio": "Laguna Salada", "distritosMunicipales": ["Cruce de Guayacanes", "Jaibón", "La Caya"] }
    ]
  }
];

/**
 * Gets a list of all province names sorted alphabetically.
 * @returns Array of province names.
 */
export function getProvincias(): string[] {
  return PROVINCIAS_RD.map(p => p.provincia).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Gets municipalities for a given province.
 * @param provincia - Province name.
 * @returns Array of municipality names, or empty array if province not found.
 */
export function getMunicipios(provincia: string): string[] {
  const prov = PROVINCIAS_RD.find(p => p.provincia === provincia);
  if (!prov) return [];
  return prov.municipios.map(m => m.municipio).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Gets municipal districts for a given province and municipality.
 * @param provincia - Province name.
 * @param municipio - Municipality name.
 * @returns Array of district names, or empty array if not found.
 */
export function getDistritosMunicipales(provincia: string, municipio: string): string[] {
  const prov = PROVINCIAS_RD.find(p => p.provincia === provincia);
  if (!prov) return [];
  const mun = prov.municipios.find(m => m.municipio === municipio);
  if (!mun) return [];
  return mun.distritosMunicipales.sort((a, b) => a.localeCompare(b, 'es'));
}
