$( document ).ready(function() {

    var map = L.map('map').setView([0,0],2)
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);

    var cluster = new Cluster()
    cluster.init(map);

});