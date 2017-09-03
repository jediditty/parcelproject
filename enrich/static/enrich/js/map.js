if (!String.prototype.supplant) {
    String.prototype.supplant = function (o) {
        return this.replace(
            /\{([^{}]*)\}/g,
            function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            }
        );
    };
}

var serviceUrl = 'http://gis.richmondgov.com/ArcGIS/rest/services/WebMercator/Parcels/MapServer/2/query';

var esrijsonFormat = new ol.format.EsriJSON();

var vectorSource = new ol.source.Vector({
    loader: function (extent, resolution, projection) {
        var url = serviceUrl + '/?f=json&' +
            'returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry=' +
            encodeURIComponent('{"xmin":' + extent[0] + ',"ymin":' +
                extent[1] + ',"xmax":' + extent[2] + ',"ymax":' + extent[3] +
                ',"spatialReference":{"wkid":102100}}') +
            '&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*' +
            '&outSR=102100';
        $.ajax({
            url: url, dataType: 'jsonp', success: function (response) {
                if (response.error) {
                    alert(response.error.message + '\n' +
                        response.error.details.join('\n'));
                } else {
                    // dataProjection will be read from document
                    var features = esrijsonFormat.readFeatures(response, {
                        featureProjection: projection
                    });
                    if (features.length > 0) {
                        vectorSource.addFeatures(features);
                    }
                }
            }
        });
    },
    strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
        tileSize: 512
    }))
});

var vector = new ol.layer.Vector({
    source: vectorSource
});

var raster = new ol.layer.Tile({
    source: new ol.source.XYZ({
        attributions: 'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
        'rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
        'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
    })
});

var map = new ol.Map({
    layers: [raster, vector],
    target: document.getElementById('map'),
    view: new ol.View({
        center: ol.proj.transform([-77.44217, 37.542342], 'EPSG:4326', 'EPSG:3857'),
        zoom: 11
    })
});

var displayFeatureInfo = function (pixel) {
    var features = [];
    map.forEachFeatureAtPixel(pixel, function (feature) {
        features.push(feature);
    });
    if (features.length > 0) {
        var info = [];
        var i, ii;
        for (i = 0, ii = features.length; i < ii; ++i) {
            info.push(features[i].get('field_name'));
        }
        document.getElementById('info').innerHTML = info.join(', ') || '(unknown)';
        map.getTarget().style.cursor = 'pointer';
    } else {
        document.getElementById('info').innerHTML = '&nbsp;';
        map.getTarget().style.cursor = '';
    }
};

map.on('pointermove', function (evt) {
    if (evt.dragging) {
        return;
    }
    var pixel = map.getEventPixel(evt.originalEvent);
    displayFeatureInfo(pixel);
});

map.on('click', function (evt) {
    displayFeatureInfo(evt.pixel);
});

var element = document.getElementById('popup');

var popup = new ol.Overlay({
    element: element,
    positioning: 'bottom-center',
    stopEvent: false
});
map.addOverlay(popup);

map.on('click', function (evt) {
    var feature = map.forEachFeatureAtPixel(evt.pixel,
        function (feature, layer) {
            return feature;
        });
    if (feature.get('enrichedData')) {
        popup.setPosition(evt.coordinate);
        $(element).popover({
            'placement': 'top',
            'html': true,
            'content': JSON.stringify(feature.get('enrichedData'))
        });
        $(element).popover('show');
    } else {
        $(element).popover('destroy');
    }
});