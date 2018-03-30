package com.ambh.storelocator.services;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.lang.reflect.Type;
import java.net.URISyntaxException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashSet;
import java.util.Set;

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

	public Set<Store> getAllStores() {
		return stores;
	}
}
