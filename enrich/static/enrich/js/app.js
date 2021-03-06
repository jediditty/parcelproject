var ppFeatureData = function (featureData) {
    // breaks all the attributes down into divs
    if (typeof (featureData.Parcel_Data.feature) !== 'undefined') {
        featureData.Parcel_Data = featureData.Parcel_Data.feature.properties;
    }
    var htmlArr = R.map(function (features) {
        var attr = [];
        for (var key in features) {
            attr.push('<div>{k}: {v}</div>'.supplant({
                'k': key,
                'v': features[key]
            }));
        }
        return attr;
    }, featureData);

    var popupHTML = []
    for (var entry in htmlArr) {
        var h = '<h4>{title}</h4>'.supplant({ 'title': entry });
        h = h + htmlArr[entry].join('') + '<br/>';
        popupHTML.push(h);
    }
    return popupHTML.join('');
};

$('#submit').click(function () {
    ths = this;
    $.post('/enrich/dispatch/', $('#dispatchData').val().trim())
        .done(function (data) {
            // some simple beautification to better print on the screen
            var enrichedData = data.features[0];
            var featureData = ppFeatureData({
                'Address': enrichedData.properties.address,
                'Description': enrichedData.properties.description,
                'Weather': enrichedData.properties.weather,
                'Parcel_Data': enrichedData.properties.parcel_data
            });
            var point_feature = new ol.Feature({});

            // must convert coords to ol3 default projection
            var point_geom = new ol.geom.Point(
                ol.proj.transform(enrichedData.geometry.coordinates, 'EPSG:4326', 'EPSG:3857')
            );
            // attach geometry to point feature
            point_feature.setGeometry(point_geom);
            // set data for popup
            point_feature.set('enrichedData', featureData);
            var vector_layer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: [point_feature]
                })
            })
            // add layer to map
            map.addLayer(vector_layer);
        })
        .error(function (e) {
            console.log(e);
        });
});