
function init() {
    STORES.setMap(createMap());
    displayStores();
}

function displayStores() {
    AJAX.getJSON("api/rest/stores", function(response, status) {
        if (status === 200) {
            STORES.load(response);
            STORES.displayAllOnMap();
            STORES.displayOnSelect(document.getElementById("stores-sel"));
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
    STORES.displayOnMap(selectedStoreId);
}

var STORES = (function() {

    var _stores = {};
    var _markers = {};
    var _map = null;
    var SEE_ALL_STORES = -1;

    var Store = function(id, name, address, lat, lng) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.lat = lat;
        this.lng = lng;
    };

    var setMap = function(map) {
        _map = map;
    }

    var load = function(storeArr) {
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

    var displayOnMap = function(storeId) {        
        
        _assertMap();

        if (storeId && storeId == SEE_ALL_STORES) {
            displayAllOnMap();
        } else if (storeId) {
            hideAllMarkers();
            _markers[storeId] && _markers[storeId].setMap(_map);
        }
    }

    var displayAllOnMap = function() {

        _assertMap();

        var keys = Object.keys(_markers);
        var bounds = new google.maps.LatLngBounds();

        for (var i = 0; i < keys.length; i++) {
            var marker = _markers[keys[i]];
            bounds.extend(marker.position);
            marker.setMap(_map);
        }
        _map.fitBounds(bounds); 
    }

    var displayOnSelect = function(select) {
        if (select) {
            var keys = Object.keys(_stores);
            select.options[select.options.length] = new Option("See all stores", SEE_ALL_STORES);
            for (var i = 0; i < keys.length; i++) {
                select.options[select.options.length] = new Option(_stores[keys[i]].name, _stores[keys[i]].id);
            }
        }
    }

    var getById = function(id) {
        return _stores[id];
    }

    var hideAllMarkers = function() {
        var keys = Object.keys(_markers);

        for (var i = 0; i < keys.length; i++) {
            _markers[keys[i]].setMap(null);
        }
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
    }

    _createStoreStoreMarkerWindow = function(store) {
        return new google.maps.InfoWindow({
          content: "<b>" + store.name + "</b><br>" + store.address
        });
    }

    var _assertMap = function() {
        if (_map === null) {
            throw "Map is not set!";
        }
    }

    return {
        Store: Store,
        setMap: setMap,
        load: load,
        displayAllOnMap: displayAllOnMap,
        displayOnSelect: displayOnSelect,
        displayOnMap: displayOnMap        
    };
})();

var AJAX = (function() {
    var request = window.ActiveXObject ?
            new ActiveXObject("Microsoft.XMLHTTP") :
            new XMLHttpRequest;
    
    var getJSON = function(url, callback) {        

        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                request.onreadystatechange = doNothing;
                callback(JSON.parse(request.responseText), request.status);
            }
        };

        request.open("GET", url, true);
        request.send(null);
    };

    var doNothing = function() {};

    return {
        getJSON: getJSON
    };
})();