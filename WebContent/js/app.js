
function init() {
    var map = createMap();
    displayStores(map);
}

function displayStores(map) {
    AJAX.getJSON("js/stores.json", function(response, status) {
        if (status === 200) {
            STORES.init(response);
            STORES.displayOnMap(map);
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

var STORES = (function() {

    var _stores = {};
    var _markers = {};

    var Store = function(id, name, address, lat, lng) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.lat = lat;
        this.lng = lng;
    };

    var init = function(storeArr) {
        if (storeArr) {
            for(var i = 0; i < storeArr.length; i++) {
                _stores[storeArr[i].id] = new Store(
                    storeArr[i].id,
                    storeArr[i].name,
                    storeArr[i].address,
                    storeArr[i].lat,
                    storeArr[i].lng
                );
                _markers[storeArr[i].id] = new google.maps.Marker({
                    position: new google.maps.LatLng(storeArr[i].lat, storeArr[i].lng),
                    map: null,
                    title: storeArr[i].name,
                    animation: google.maps.Animation.DROP
                });
            }
        }
    };

    var displayOnMap = function(map) {
        var keys = Object.keys(_markers);
        var bounds = new google.maps.LatLngBounds();

        for (var i = 0; i < keys.length; i++) {
            var marker = _markers[keys[i]];
            bounds.extend(marker.position);
            marker.setMap(map);
        }
        map.fitBounds(bounds); 
    }

    return {
        Store: Store,
        init: init,
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