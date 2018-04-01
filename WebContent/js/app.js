
function init() {
    STORES.config({
        "map": createMap(),
        "store-select": document.getElementById("stores-sel"),
        "search-input": document.getElementById("search-location"),
        "directions": document.getElementById("directions")
    });
    displayStores();
}

function displayStores() {
    AJAX.getJSON("api/rest/stores", {}, function(response, status) {
        if (status === 200) {
            STORES.load(response);
            STORES.display();
        }
    });
}

function createMap() {
    var mapOptions = {
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    return new google.maps.Map(document.getElementById("map"), mapOptions);
}

google.maps.event.addDomListener(window, "load", init);

function onSelectStore() {
    var selElem = document.getElementById("stores-sel");
    var selectedStoreId = selElem.options[selElem.selectedIndex].value;
    STORES.displayDirections(selectedStoreId);
}

function onSearch() {
    var searchLocation = document.getElementById("search-location").value;
    var radius = document.getElementById("radius").value;
    STORES.displayInRadius(radius, searchLocation);
}

var STORES = (function() {

    var _stores = {};
    var _markers = {};
    var _userMarker;
    var _userMarkerIcon;
    var _map = null;
    var SEE_ALL_STORES = -1;
    var _GEOCODER = new google.maps.Geocoder();
    var _DIRECTIONS_SERVICE = new google.maps.DirectionsService();
    var _DIRECTIONS_RENDERER = new google.maps.DirectionsRenderer();
    var _storeSelect;
    var _searchInput;
    var _autoComplete;
    var _directionsPanel;
    var _searchedLocation = false;

    var Store = function(id, name, address, lat, lng) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.lat = lat;
        this.lng = lng;
    };

    var config = function(configObj) {
        _map = configObj["map"];
        _storeSelect = configObj["store-select"];
        _searchInput = configObj["search-input"];
        _createAutocomplete(_map, _searchInput);
        _createUserMarkerIcon();
        _directionsPanel = configObj["directions"];
    }

    var load = function(storeArr) {
        _stores = {};
        _markers = {};
        if (storeArr) {
            for(var i = 0; i < storeArr.length; i++) {
                _stores[storeArr[i].id] = new Store(
                    storeArr[i].id,
                    storeArr[i].name,
                    storeArr[i].address,
                    storeArr[i].lat,
                    storeArr[i].lng
                );
                _markers[storeArr[i].id] = _createMarker(storeArr[i]);
            }
        }
    };

    var reset = function(storeArr) {
        hideAllMarkers();
        load(storeArr);
    };

    var display = function() {
        _DIRECTIONS_RENDERER.setMap(null);
        _DIRECTIONS_RENDERER.setPanel(null);
        _displayAllOnMap();
        _displayOnSelect();
    }

    var displayOnMap = function(storeId) {        
        
        _assertMap();

        if (storeId && storeId == SEE_ALL_STORES) {
            _displayAllOnMap();
        } else if (storeId) {
            hideAllMarkers();
            _markers[storeId] && _markers[storeId].setMap(_map);
        }
    };

    var _displayAllOnMap = function() {

        _assertMap();

        var keys = Object.keys(_markers);
        var bounds = new google.maps.LatLngBounds();

        for (var i = 0; i < keys.length; i++) {
            var marker = _markers[keys[i]];
            bounds.extend(marker.position);
            marker.setMap(_map);
        }
        _map.fitBounds(bounds); 
    };

    var _displayOnSelect = function() {
        if (_storeSelect) {
            var keys = Object.keys(_stores);
            _clearSelect(_storeSelect);
            if (keys.length == 0) {
                _storeSelect.options[0] = new Option("No stores to display", -2);
            } else {
                _storeSelect.options[_storeSelect.options.length] = new Option("See all stores", SEE_ALL_STORES);
                for (var i = 0; i < keys.length; i++) {
                    _storeSelect.options[_storeSelect.options.length] = new Option(_stores[keys[i]].name, _stores[keys[i]].id);
                }
            }
        }
    };

    var hideAllMarkers = function() {
        var keys = Object.keys(_markers);

        for (var i = 0; i < keys.length; i++) {
            _markers[keys[i]].setMap(null);
        }
    };

    var displayInRadius = function(radius, address) {
        var place = _autoComplete.getPlace();
        if (place) {
            _doRadiusRequest(
                radius,
                place.geometry.location.lat(),
                place.geometry.location.lng()
            );
        } else {
            _GEOCODER.geocode({"address": address}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    _doRadiusRequest(
                        radius,
                        results[0].geometry.location.lat(),
                        results[0].geometry.location.lng()
                    );
                }
            });
        }
    };

    var displayDirections = function(storeId) {
        if (storeId && storeId != SEE_ALL_STORES) {
            if (_searchedLocation) {
                hideAllMarkers();
                _userMarker.setMap(null);
                var request = {
                    origin: _searchInput.value,
                    destination: _stores[storeId].address,
                    travelMode: google.maps.DirectionsTravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.METRIC
                };
                _DIRECTIONS_SERVICE.route(request, function(response, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                       _DIRECTIONS_RENDERER.setDirections(response);
                       _DIRECTIONS_RENDERER.setMap(_map);
                       _DIRECTIONS_RENDERER.setPanel(_directionsPanel);
                    }
                });
            } else {
                displayOnMap(storeId);
            }
        } else if (storeId && storeId == SEE_ALL_STORES) {
            display();
            if (_searchedLocation) {
                _userMarker.setMap(_map);
            }
        }            
    };

    var _doRadiusRequest = function(radius, lat, lng) {
        var params = {
            "radius": radius,
            "lat": Number.parseFloat(lat),
            "lng": Number.parseFloat(lng)
        };
        AJAX.getJSON("api/rest/stores/search/radius", params, function(response, status) {
            if (status === 200) {
                _searchedLocation = true;
                reset(response);
                display();
                _displayUserMaker(lat, lng);
            }
        });
    }

    var _createMarker = function(store) {
        var newMarker = new google.maps.Marker({
           position: new google.maps.LatLng(store.lat, store.lng),
           map: null,
           title: store.name,
           animation: google.maps.Animation.DROP
        });

        newMarker.addListener('click', function() {
            var infowindow = _createStoreStoreMarkerWindow(store);
            infowindow.open(_map, newMarker);
        });

        return newMarker;
    };

    _createStoreStoreMarkerWindow = function(store) {
        return new google.maps.InfoWindow({
          content: "<b>" + store.name + "</b><br>" + store.address
        });
    };

    var _assertMap = function() {
        if (_map === null) {
            throw "Map is not set!";
        }
    };

    var _clearSelect = function(select) {
        for(var i = select.options.length - 1; i >= 0; i--) {
            select.remove(i);
        }
    };

    var _createAutocomplete = function(map, autoCompleteElem) {
        _autoComplete = new google.maps.places.Autocomplete(autoCompleteElem);
        _autoComplete.bindTo('bounds', map);
    };

    var _createUserMarkerIcon = function() {
        var userPinColor = "009688";
        _userMarkerIcon = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + userPinColor,
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34));
    };

    var _displayUserMaker = function(lat, lng) {
        _assertMap();

        if (!_userMarker) {
            _userMarker = new google.maps.Marker({
                title: "User Location",
                animation: google.maps.Animation.DROP,
                icon: _userMarkerIcon,
                map: _map
            });
        }
        _userMarker.setPosition(new google.maps.LatLng(lat, lng));
    };

    return {
        Store: Store,
        config: config,
        load: load,
        display: display,
        displayOnMap: displayOnMap,
        displayInRadius: displayInRadius,
        reset: reset,
        displayDirections: displayDirections    
    };
})();

var AJAX = (function() {
    var request = window.ActiveXObject ?
            new ActiveXObject("Microsoft.XMLHTTP") :
            new XMLHttpRequest;
    
    var getJSON = function(url, params, callback) {        

        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                request.onreadystatechange = doNothing;
                callback(JSON.parse(request.responseText), request.status);
            }
        };

        request.open("GET", url + buildGetParams(params), true);
        request.send(null);
    };

    var buildGetParams = function(params) {
        if (params) {
            var keys = Object.keys(params);
            var urlParams = "?";
            for (var i = 0; i < keys.length; i++) {
                urlParams += keys[i] + "=" + params[keys[i]];
                if (i !== keys.length - 1) {
                    urlParams += "&";
                }
            }
            return urlParams;
        } else {
            return "";
        }
    };

    var doNothing = function() {};

    return {
        getJSON: getJSON
    };
})();