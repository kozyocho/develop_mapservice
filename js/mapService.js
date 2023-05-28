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

                //地図の初期化
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

function changeTravelMode(mode) {
    travelMode = mode;
    var drivingBtn = document.getElementById('driving-btn');
    var walkingBtn = document.getElementById('walking-btn');

    if (mode == 'DRIVING') {
        drivingBtn.classList.add('selected');
        walkingBtn.classList.remove('selected');
    } else {
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

//ルートを探索する前に始点と目的地を取得する関数
function calculateAndDisplayRoute() {
    //目的地を取得
    var destination = document.getElementById('destination-input').value;

    //探索を開始する位置
    var startPos;

    //入力された地点があればそれを取得
    if (document.getElementById('startPosition-input').value != "") {
        startPos = document.getElementById('startPosition-input').value;

        if(document.getElementById('facility-input').value != ""){
            keyword = document.getElementById('facility-input').value;
        }

        if(document.getElementById('searchRange-input').value != ""){
            range = document.getElementById('searchRange-input').value;
        }
    }
    //なければ現在地を取得
    else {
        navigator.geolocation.getCurrentPosition(function (position) {
            startPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            if(document.getElementById('facility-input').value != ""){
                keyword = document.getElementById('facility-input').value;
            }

            if(document.getElementById('searchRange-input').value != ""){
                range = document.getElementById('searchRange-input').value;
            }

            //getCurrentPositionは非同期なのでstartPosに代入される前に下のdirectionsService.routeが通ってしまう。
            //それ防ぐためにgetCurrentPositionのコールバックでdirectionsService.routeを行う
            calculateRoute(startPos, destination, keyword, range);
            return;
        })
    }

    //実際にルート探索する関数
    calculateRoute(startPos, destination, keyword, range);
}

//ルート探索
//startPos: 出発点
//destination: 目的地
function calculateRoute(startPos, destination, keyword, range) {

    //DirectionsServiceオブジェクトの作成
    directionsService = new google.maps.DirectionsService();
    //DirectionsRendererオブジェクトの作成
    directionsRenderer = new google.maps.DirectionsRenderer();

    //ルート検索のリクエストパラメータ設定
    var request = {
        origin: startPos,
        destination: destination,
        travelMode: travelMode
    };

    //ルート検索の実行
    directionsService.route(request,
        function (result, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                //ルートを地図上に表示
                directionsRenderer.setDirections(result);
                directionsRenderer.setMap(map);

                //ルート上の全ての点を取得
                //var route = result.routes[0];
                //var points = [];
                //getAllPoints(route, points);
                var points = result.routes[0].overview_path;

                //各点から半径200m以内のコンビニを検索
                for(var k = 0; k < points.length; k++){
                    searchFacility(points[k], keyword, range);
                }
            } else {
                window.alert('ルート検索に失敗しました。');
            }
        }
    );
}

//ルート上の全ての点を取得
function getAllPoints(route, points) {
    for (var i = 0; i < route.legs.length; i++) {
        var leg = route.legs[i];

        for (var j = 0; j < leg.steps.length; j++) {
            var step = leg.steps[j];
            points.push(step.start_location);
        }
    }
}

//施設検索関数
function searchFacility(location, keyword, range) {

    //ユーザー入力に基づいて施設のタイプを取得
    getPlaceType(keyword, function(types){

        // PlacesServiceオブジェクトの作成
        var placesService = new google.maps.places.PlacesService(map);
        
        //施設検索のリクエストパラメータ設定
        var request = {
            location: location,
            radius: range,
            type: types
        };
        console.log("タイプ：" + types);

        //施設検索の実行
        placesService.nearbySearch(request, function(results, status){
            if(status == google.maps.places.PlacesServiceStatus.OK){
                //施設を地図上に表示
                for (var i = 0; i < results.length; i++) {
                    createMarker(results[i]);
                }
            }
        });
    });
}

//地図にピンを立てる
function createMarker(place){
    var marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        title: place.name //ピンに施設名を設定
    });

    marker.addListener("click", function(){
        var infoWindow = new google.maps.InfoWindow({
            content: place.name //施設名を表示
        });
        infoWindow.open(map, marker);
    });
}

//ユーザーの入力に基づいて施設を検索し、typeを取得する関数
function getPlaceType(keyword, callback){
    //PlacesServiceオブジェクトの作成
    var placesService = new google.maps.places.PlacesService(map);

    //施設検索のリクエスト
    var request = {
        query: keyword
    };

    //施設検索の実行
    placesService.textSearch(request,
        function(results, status){
            if(status == google.maps.places.PlacesServiceStatus.OK){
                if(results.length > 0){
                    var place = results[0];
                    var types = place.types;
                    var primaryType = types[0]; //先頭のタイプのみ取得
                    callback(primaryType);
                }
            }
        });
}

//ルートを削除
function deleteRoute() {
    //ルートマーカーを削除
    directionsRenderer.setMap(null);

    //入力欄をクリア
    document.getElementById('destination-input').value = null;

    //currentPositionMarker.setMap(null);

    facilityMarker.setMap(null);
}

