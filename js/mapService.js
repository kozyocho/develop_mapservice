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

function searchFacility() {
    //”経路沿いで検索する施設”に入力された文字列を取得
    var facility = document.getElementById('facility-input').value;

    //検索範囲を取得してintにパース
    var searchRangeInput = document.getElementById('searchRange-input').value;
    var searchRange = parseInt(searchRangeInput);

    if(isNaN(searchRange)){
        window.alert('検索範囲には数字を入力してください。');
        return;
    }

    searchRange += 'm';
    var request = {
        location: map.getCenter(),
        radius: searchRange,
        query: facility
    };

    var service = new google.maps.places.PlacesService(map);
    service.textSearch(request, function (results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            //検索結果があればピンを表示
            for (var i = 0; i < results.length; i++) {
                var places = results[i];

                facilityMarker = new google.maps.Marker({
                    map: map,
                    position: places.geometry.location
                });

            }
        }
        else {
            window.alert('施設の検索に失敗しました。');
        }
    })
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
