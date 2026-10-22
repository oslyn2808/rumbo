// Ensambla las tres capas: acceso a datos -> logica de negocio. La API recibe el resultado.
import { createAiClient } from './services/aiClient.js';
import { createAuthService } from './services/authService.js';
import { createDestinationService } from './services/destinationService.js';
import { createMonumentService } from './services/monumentService.js';
import { createTripService } from './services/tripService.js';
import { createWeatherService } from './services/weatherService.js';
import { createMonumentRepository } from './data/monumentRepository.js';
import { createTripRepository } from './data/tripRepository.js';
import { createUserRepository } from './data/userRepository.js';
import { findDestination, listDestinations } from './data/destinations.js';

const destinationCatalog = { list: listDestinations, find: findDestination };

export function buildServices({ db, config, ai = createAiClient(config), weatherOptions }) {
  const users = createUserRepository(db);
  const trips = createTripRepository(db);
  const monuments = createMonumentRepository(db);

  return {
    authService: createAuthService({ users, config }),
    destinationService: createDestinationService({ destinations: destinationCatalog }),
    weatherService: createWeatherService(weatherOptions),
    tripService: createTripService({ trips, ai, destinations: destinationCatalog }),
    monumentService: createMonumentService({ monuments, ai }),
  };
}
