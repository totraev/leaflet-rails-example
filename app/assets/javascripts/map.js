$( document ).ready(function() {

    var map = L.map('map').setView([0,0],7)
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);

    var addedMarkers = {};
    var clusterMarkers = new L.MarkerClusterGroup({
        animateAddingMarkers:true
    });
    map.addLayer(clusterMarkers);


    map.on('moveend', function(e) {
        var bounds = map.getBounds();
        var bbox = 'bbox=';


        bbox += bounds.getWest() + ',';
        bbox += bounds.getSouth() + ',';
        bbox += bounds.getEast() + ',';
        bbox += bounds.getNorth() + ',';

        console.log(bbox)
        console.log(map.getZoom())

        if(map.getZoom() >= 6){
            $.ajax({
                dataType: "json",
                url: 'http://api.ais.owm.io/api/box',
                data: bbox,
                success: function(data){
                    console.log(data)
                    var updated = 0,
                        added = 0;

                    $.each(data.list, function(i, item){
                        if(item.mmsi in addedMarkers) {
                            addedMarkers[item.mmsi].setLatLng([item.coord[1],item.coord[0]])
                            updated++;
                        }else{
                            addedMarkers[item.mmsi] = L.marker([item.coord[1], item.coord[0]]);
                            clusterMarkers.addLayer(addedMarkers[item.mmsi]);
                            added++;
                        }
                    })
                    console.log('updated: '+ updated)
                    console.log('added: ' + added)

                }
            });
        }

    });

});