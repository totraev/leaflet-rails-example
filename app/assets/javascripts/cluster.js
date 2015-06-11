    /*
    * Идея реализации:
    *
    * Если зум достаточно блиско к карте, то маркеры запрашиваются напрямую с api,
    * отправляется текущий bbox карты. При передвижении по карте отправляются новые запросы.
    *
    * Если значение зума меньше заданного числа, то данные запрашиваются с сервера
    * в виде уже кластеризованных объектов. Сервер запрашивает данные с api для всей карты,
    * кластеризует их и кеширует.
    * */

    function Cluster(){

        this._map

        this._clientMarkers
        this._serverMarkers
        this._addedMarkers = []
        this._serverInit = false


    }

    Cluster.prototype = {


        init: function(map){
            this.setMap(map)
            this._setClientsMarkersLayer()
            this._setServerMarkersLayer()
            this.pullData()
            this._onMove()
        },

        //При движении карты подгружаем данные
        _onMove: function(){
            var self = this


            this._map.on('moveend', function(e){
                self.pullData()
                console.log(self.getZoom())
            })
        },


        setMap: function(map){
            this._map = map
        },

        getZoom: function(){
            return this._map.getZoom()
        },

        //Если zoom больше 6, то запрашиваем данные с api, если нет - кэш с сервера
        pullData: function(){
            this.getZoom() > 6 ? this._pullMarkers(this._getBounds()): this._pullClusters();
        },

        //Устанавливаем слой для маркеров с api
        _setClientsMarkersLayer: function(){
            this._clientMarkers = new L.MarkerClusterGroup({
                animateAddingMarkers:false,
                disableClusteringAtZoom: 8
            })
        },

        //Слой для кластеров с кеша от сервера
        _setServerMarkersLayer: function(){
            this._serverMarkers = new L.MarkerClusterGroup({

                singleMarkerMode: true,
                iconCreateFunction: function(cluster){

                    var markers = cluster.getAllChildMarkers();
                    var count = 0;

                    $.each(markers, function(i, marker){
                        count += marker.count;
                    })

                    var c = ' marker-cluster-';
                    if (count < 10) {
                        c += 'small';
                    } else if (count < 100) {
                        c += 'medium';
                    } else {
                        c += 'large';
                    }

                    return new L.DivIcon({ html: '<div><span>' + count + '</span></div>', className: 'marker-cluster' + c, iconSize: new L.Point(40, 40) });
                }
            });
        },

        //Формируем прямоугольник запроса. Левый-нижний и правый-верхний угол карты
        _getBounds: function(){
            var bounds = this._map.getBounds();
            var bbox = 'bbox=';
            var i = 0

            bbox += bounds.getWest()-i + ',';
            bbox += bounds.getSouth()-i + ',';
            bbox += bounds.getEast()+i + ',';
            bbox += bounds.getNorth()+i + ',';

            return bbox
        },

        //Запрос данных с api для текушего прямоугольника
        _pullMarkers: function(bbox){
            this._removeServerLayer()

            var self = this

            console.log(bbox);

            $.ajax({
                dataType: "json",
                url: 'http://api.ais.owm.io/api/box',
                data: bbox,
                success: function(data){
                    console.log(data)

                    $.each(data.list, function(i, item){
                        self._isSet(item.mmsi) ? self._updateMarker(item): self._setMarker(item);
                    })
                }
            });
        },

        //Запрос закешированных кластеров с сервера
        _pullClusters: function(){
            this._removeClientLayer()

            if(this._serverInit)
                return;

            var self = this

            $.ajax({
                dataType: "json",
                url: '/cluster',
                success: function(data){

                    $.each(data.list, function(i, item){
                        var marker = new L.marker([item.center[1], item.center[0]])

                        marker.on('click', function(){
                            self._map.setView(marker.getLatLng(), 7)
                        })

                        marker.count = item.count
                        self._serverMarkers.addLayer(marker)
                    })

                    self._serverInit = true
                }
            });

            this._serverMarkers.addTo(this._map)

        },

        //Добавлен ли маркер на карту
        _isSet: function(id){
            return (id in this._addedMarkers)
        },

        //Если маркер добавлен, обновляем позицию
        _updateMarker: function(item){
            this._addedMarkers[item.mmsi].setLatLng([item.coord[1],item.coord[0]])
        },

        //Добавляем маркер на карту
        _setMarker: function(item){
            var marker = L.marker([item.coord[1], item.coord[0]]);

            this._addedMarkers[item.mmsi] = marker
            this._clientMarkers.addLayer(marker);
        },

        //Удаляем слой с кластерами с сервара, добавляем слой с маркерами с api
        _removeServerLayer: function(){
            if(this._map.hasLayer(this._serverMarkers)){
                this._map.removeLayer(this._serverMarkers)
            }
            if(!this._map.hasLayer(this._clientMarkers)){
                this._map.addLayer(this._clientMarkers)
            }
        },

        //Удаляем слой с маркерами, полученными из api, добавляем слой с кластерами из кеша
        _removeClientLayer: function(){
            if(this._map.hasLayer(this._clientMarkers)){
                this._map.removeLayer(this._clientMarkers)
            }
            if(!this._map.hasLayer(this._serverMarkers)){
                this._map.addLayer(this._serverMarkers)
            }
        }


    }

