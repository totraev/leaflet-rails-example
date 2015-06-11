
    function Cluster(){

        this._map

        this._clientMarkers
        this._serverMarkers
        this._addedMarkers = []
        this._serverInit = false


    }

    Cluster.prototype = {
        self: this,

        init: function(map){
            this.setMap(map)
            this.setClientsMarkersLayer()
            this.setServerMarkersLayer()
            this.pullData()
            this.onMove()
        },

        onMove: function(){
            var self = this

            this._map.on('moveend', function(e){
                self.pullData()
            })
        },


        setMap: function(map){
            this._map = map
        },

        getZoom: function(){
            return this._map.getZoom()
        },

        setClientsMarkersLayer: function(){
            this._clientMarkers = new L.MarkerClusterGroup({
                animateAddingMarkers:false
            })
        },

        setServerMarkersLayer: function(){
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

        pullData: function(){
            this.getZoom() > 5 ? this._pullMarkers(): this._pullClusters();
        },

        _pullMarkers: function(){
            this._removeServerLayer()

            var self = this
            var bounds = this._map.getBounds();
            var bbox = 'bbox=';

            bbox += bounds.getWest() + ',';
            bbox += bounds.getSouth() + ',';
            bbox += bounds.getEast() + ',';
            bbox += bounds.getNorth() + ',';

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
                            self._map.setView(marker.getLatLng(), 6)
                        })

                        marker.count = item.count
                        self._serverMarkers.addLayer(marker)
                    })

                    self._serverInit = true
                }
            });

            this._serverMarkers.addTo(this._map)

        },

        _isSet: function(id){
            return (id in this._addedMarkers)
        },

        _updateMarker: function(item){
            this._addedMarkers[item.mmsi].setLatLng([item.coord[1],item.coord[0]])
        },

        _setMarker: function(item){
            var marker = L.marker([item.coord[1], item.coord[0]]);

            this._addedMarkers[item.mmsi] = marker
            this._clientMarkers.addLayer(marker);
        },

        _removeServerLayer: function(){
            if(this._map.hasLayer(this._serverMarkers)){
                this._map.removeLayer(this._serverMarkers)
            }
            if(!this._map.hasLayer(this._clientMarkers)){
                this._map.addLayer(this._clientMarkers)
            }
        },

        _removeClientLayer: function(){
            if(this._map.hasLayer(this._clientMarkers)){
                this._map.removeLayer(this._clientMarkers)
            }
            if(!this._map.hasLayer(this._serverMarkers)){
                this._map.addLayer(this._serverMarkers)
            }
        }


    }

