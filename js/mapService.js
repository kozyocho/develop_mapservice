let map;
let directionsService;
let directionsRenderer;
let currentPositionMarker;
let travelMode = 'DRIVING';
let markers = [];
let currentPos;

//地図の初期化
function initMap() {
    if (navigator.geolocation) {
        //現在地を取得
        navigator.geolocation.getCurrentPosition(
            function (position) {
                let lat = position.coords.latitude;
                let lng = position.coords.longitude;

                //地図の初期化
                map = new google.maps.Map(document.getElementById('map'), {
                    center: { lat: lat, lng: lng },
                    zoom: 15
                });

                //現在地にピンを立てる
                currentPositionMarker = new google.maps.Marker(
                    {
                        position: { lat: lat, lng: lng },
                        map: map,
                        title: "現在地"
                    }
                );

                //後で使いまわせるように現在地を保持しておく
                currentPos = new google.maps.LatLng(lat, lng);

                directionsService = new google.maps.DirectionsService();
                directionsRenderer = new google.maps.DirectionsRenderer();
                directionsRenderer.setMap(map);
            }
        );
    } else {
        window.alert('現在地を取得できません。');
    }
}

//移動手段の変更
function changeTravelMode(mode) {
    travelMode = mode;
    let drivingBtn = document.getElementById('driving-btn');
    let walkingBtn = document.getElementById('walking-btn');

    if (mode == 'DRIVING') {
        drivingBtn.classList.add('selected');
        walkingBtn.classList.remove('selected');
    } else if(mode == 'WALKING'){
        drivingBtn.classList.remove('selected');
        walkingBtn.classList.add('selected');
    }
}

//現在地を表示
function showCurrentPosition() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                let lat = position.coords.latitude;
                let lng = position.coords.longitude;

                map.setCenter({ lat: lat, lng: lng });

                currentPositionMarker.setPosition({ 
                    lat: lat,
                    lng: lng
                });
            }
        );
    } else {
        window.alert('現在地を取得できません。');
    }
}

//ルートを探索する前に始点と目的地を取得する関数
function calculateAndDisplayRoute() {
    //目的地を取得
    let destination = document.getElementById('destination-input').value;
    //探索を開始する位置
    let startPos;

    if(document.getElementById('facility-input').value != ""){
        keyword = document.getElementById('facility-input').value;
    } else{
        window.alert('施設を入力してください。')
    }
    
    if(document.getElementById('searchRange-input').value != ""){
        range = document.getElementById('searchRange-input').value;
    } else{
        window.alert('検索範囲を入力してください。')
    }

    //入力された地点があればそれを取得
    if (document.getElementById('startPosition-input').value != "") {
        startPos = document.getElementById('startPosition-input').value;
    } else {
        startPos = currentPos; //なければstartPosに現在地を代入
    }

    //実際にルート探索する関数
    calculateRoute(startPos, destination, keyword, range);
}

//ルート探索
//startPos: 出発点
//destination: 目的地
//keyword: 検索施設
//range: 検索範囲
function calculateRoute(startPos, destination, keyword, range) {

    //DirectionsServiceオブジェクトの作成
    directionsService = new google.maps.DirectionsService();
    //DirectionsRendererオブジェクトの作成
    directionsRenderer = new google.maps.DirectionsRenderer();

    //ルート検索のリクエストパラメータ設定
    let request = {
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
    for (let i = 0; i < route.legs.length; i++) {
        let leg = route.legs[i];

        for (let j = 0; j < leg.steps.length; j++) {
            let step = leg.steps[j];
            points.push(step.start_location);
        }
    }
}

//施設検索関数
function searchFacility(location, keyword, range) {

    //ユーザー入力に基づいて施設のタイプを取得
    getPlaceType(keyword, function(types){

        // PlacesServiceオブジェクトの作成
        let placesService = new google.maps.places.PlacesService(map);
        
        //施設検索のリクエストパラメータ設定
        let request = {
            location: location,
            radius: range,
            type: types
        };
        console.log("タイプ：" + types);

        //施設検索の実行
        placesService.nearbySearch(request, function(results, status){
            if(status == google.maps.places.PlacesServiceStatus.OK){
                //施設を地図上に表示
                for (let i = 0; i < results.length; i++) {
                    createMarker(results[i]);
                    //console.log(results[i]);
                }
            }
        });
    });
}

//地図にピンを立てる
function createMarker(place){
    let marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        title: place.name //ピンに施設名を設定
    });

    marker.addListener("click", function(){
        let infoWindow = new google.maps.InfoWindow({
            //content: place.name //施設名を表示
            content: getMarkerInfoContents(place) //情報ウィンドウに表示する内容を取得
        });
        infoWindow.open(map, marker);
    });

    markers.push(marker);
}

//ユーザーの入力に基づいて施設を検索し、typeを取得する関数
function getPlaceType(keyword, callback){
    //PlacesServiceオブジェクトの作成
    let placesService = new google.maps.places.PlacesService(map);

    //施設検索のリクエスト
    let request = {
        query: keyword
    };

    //施設検索の実行
    placesService.textSearch(request,
        function(results, status){
            if(status == google.maps.places.PlacesServiceStatus.OK){
                if(results.length > 0){
                    let place = results[0];
                    let types = place.types;
                    let primaryType = types[0]; //先頭のタイプのみ取得
                    callback(primaryType);
                }
            }
        }
    );
}

//ピンの情報ウィンドウの内容を取得する関数
function getMarkerInfoContents(place){
    let content = "<div>";

    //写真を表示
    if(place.photos && place.photos.length > 0){
        let photoUrl = place.photos[0].getUrl();
        content += "<img src='" + photoUrl + "' />";
    }

    //評価を表示
    if(place.rating){
        content += "<p>評価: " + place.rating + "</p>";
    }

    content += "</div>";

    return content;
}

//ルートを削除
function deleteRoute() {
    //ルートマーカーを削除
    directionsRenderer.setMap(null);

    //入力欄をクリア
    document.getElementById('startPosition-input').value = '';
    document.getElementById('destination-input').value = '';
    document.getElementById('facility-input').value = '';
    document.getElementById('searchRange-input').value = '';


    //全てのピンを削除
    for(let i = 0; i < markers.length; i++){
        markers[i].setMap(null);
        delete markers[i];
    }
}

