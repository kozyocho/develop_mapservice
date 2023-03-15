var map;
var directionsService;
var directionsRenderer;
var currentPositionMarker;
var travelMode = 'DRIVING';
var facilityMarker;

function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;

                map = new google.maps.Map(document.getElementById('map'), {
                    center: { lat: lat, lng: lng },
                    zoom: 15
                });

                currentPositionMarker = new google.maps.Marker(
                    {
                        position: { lat: lat, lng: lng },
                        map: map,
                        title: "現在地"
                    }
                );

                directionsService = new google.maps.DirectionsService();
                directionsRenderer = new google.maps.DirectionsRenderer();
                directionsRenderer.setMap(map);

            }
        );
    }
    else {
        window.alert('お使いのブラウザは現在地を取得できません。');
    }
}

function changeTravelMode(mode){
    travelMode = mode;
    var drivingBtn = document.getElementById('driving-btn');
    var walkingBtn = document.getElementById('walking-btn');

    if(mode == 'DRIVING'){
        drivingBtn.classList.add('selected');
        walkingBtn.classList.remove('selected');
    }else{
        drivingBtn.classList.remove('selected');
        walkingBtn.classList.add('selected');
    }
}

function showCurrentPosition() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;

                map.setCenter({ lat: lat, lng: lng });

                currentPositionMarker.setPosition({ lat: lat, lng: lng });
            }
        );
    }
    else {
        window.alert('お使いのブラウザは現在地を取得できません。');
    }
}

//ルートを探索
function calculateAndDisplayRoute() {
    //目的地を取得
    var destination = document.getElementById('destination-input').value;

    //探索を開始する位置
    var startPos;

    //入力された地点があればそれを取得
    if(document.getElementById('startPosition-input').value != ""){
        startPos = document.getElementById('startPosition-input').value;
    }
    //なければ現在地を取得
    else{
        navigator.geolocation.getCurrentPosition(function(position){
            startPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            //getCurrentPositionは非同期なのでstartPosに代入される前に下のdirectionsService.routeが通ってしまう。
            //それ防ぐためにgetCurrentPositionのコールバックでdirectionsService.routeを行う
            calculateRoute(startPos, destination);
            return;
        })
    }

    calculateRoute(startPos, destination);
}

function calculateRoute(startPos, destination){
    directionsService.route(
        {
            origin: startPos,
            destination: destination,
            travelMode: travelMode
        },
        function (response, status) {
            if (status === 'OK') {
                directionsRenderer.setDirections(response);
            }
            else {
                window.alert('経路の検索に失敗しました。');
            }
        }
    );
}

// ルート上のすべての点を取得して、各点から半径200m以内にあるレストランを検索する関数
function searchPlacesAlongRoute(route, map, type) {
    var path = route.routes[0].overview_path;
    var placesService = new google.maps.places.PlacesService(map);

    path.forEach(function(point){
        placesService.nearbySearch({
            location: point,
            radius: 200,
            type:[type]
        }, function(results, status){
            if(status == google.maps.places.PlacesServiceStatus.OK){
                for(var i = 0; i < results.length; i++){
                    var place = results[i];
                    var marker = new google.maps.Marker({
                        position: place.geometry.location,
                        map: map
                    });
                }
            }
        });
    });
}

//ルートを削除
function deleteRoute() {
    //ルートマーカーを削除
    directionsRenderer.setMap(null);

    //入力欄をクリア
    document.getElementById('destination-input').value = null;

    currentPositionMarker.setMap(null);

    facilityMarker.setMap(null);
}
