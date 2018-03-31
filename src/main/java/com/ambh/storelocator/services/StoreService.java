package com.ambh.storelocator.services;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.lang.reflect.Type;
import java.net.URISyntaxException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

import com.ambh.storelocator.domain.Store;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.google.gson.stream.JsonReader;

public class StoreService {

	private static StoreService INSTANCE;

	private static final String STORE_FILE = "stores.json";
	private Set<Store> stores;
	private final Gson gson = new Gson();

	private StoreService() {
	}

	public static StoreService getInstance() {
		if (INSTANCE == null) {
			INSTANCE = new StoreService();
			INSTANCE.init();
		}

		return INSTANCE;
	}

	private void init() {
		try {
			ClassLoader classLoader = getClass().getClassLoader();
			final Path path = Paths.get(classLoader.getResource(STORE_FILE).toURI());
			final JsonReader reader = new JsonReader(new FileReader(path.toFile()));
			final Type storeHashSetType = new TypeToken<HashSet<Store>>() {}.getType();
			stores = gson.fromJson(reader, storeHashSetType);
		} catch (URISyntaxException | FileNotFoundException e) {
			e.printStackTrace();
		}
	}

	/**
	 * Returns all stores
	 */
	public Set<Store> getAllStores() {
		return stores;
	}
	
	/**
	 * Returns all stores within {@code radius} with center in {@code lat} and {@code lng}
	 * 
	 * @param radius measurement in kms
	 */
	public Set<Store> getAllWithinRadius(int radius, double lat, double lng) {
		return stores.stream()
			.filter(store -> isWithin(store, radius, lat, lng))
			.collect(Collectors.toSet());
	}
	
	private boolean isWithin(Store store, int radius, double lat, double lng) {
		return distance(lat, lng, store.getLat(), store.getLng()) <= radius;
	}

	private static final int EARTH_RADIUS = 6371; // Approximate Earth's radius in KMs

    private static double distance(double startLat, double startLng,
                                  double endLat, double endLng) {

        double dLat  = Math.toRadians((endLat - startLat));
        double dLng = Math.toRadians((endLng - startLng));

        startLat = Math.toRadians(startLat);
        endLat   = Math.toRadians(endLat);

        double a = haversin(dLat) + Math.cos(startLat) * Math.cos(endLat) * haversin(dLng);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS * c;
    }

    private static double haversin(double val) {
        return Math.pow(Math.sin(val / 2), 2);
    }
}
