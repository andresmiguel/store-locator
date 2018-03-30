package com.ambh.storelocator.rest;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.ambh.storelocator.services.StoreService;
import com.google.gson.Gson;

@Path("/stores")
public class StoreRestController {
	
	private final Gson gson = new Gson();

	@GET
	@Produces(MediaType.APPLICATION_JSON)
	public String getAllStores() {
		return gson.toJson(StoreService.getInstance().getAllStores());
	}
}
