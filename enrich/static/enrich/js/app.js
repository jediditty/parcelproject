var ppFeatureData = function(featureData) {
    featureData.Parcel_Data = featureData.Parcel_Data.feature.properties;
    var htmlArr = R.map(function(features) {
        var attr = [];
        for (key in features) {
            attr.push('<div>{k}: {v}</div>'.supplant({
                                                'k': key,
                                                'v': features[key]
            }));
        }
        return attr;
    }, featureData);

    var popupHTML = []
    for (entry in htmlArr) {
        var h = '<h4>{title}</h4>'.supplant({'title': entry});
        h = h + htmlArr[entry].join('') + '<br/>'; 
        popupHTML.push(h);
    }
    return popupHTML.join('');
};

$('#submit').click(function () {
    ths = this;
    $.post('/enrich/dispatch/', $('#dispatchData').val().trim())
        .done(function (data) {
            var enrichedData = data.features[0];
            featureData = {
                'Address': enrichedData.properties.address,
                'Description': enrichedData.properties.description,
                'Weather': enrichedData.properties.weather,
                'Parcel_Data': enrichedData.properties.parcel_data
            };
            featureData = ppFeatureData(featureData);
            var point_feature = new ol.Feature({});

            // must convert coords to ol3 default projection
            var point_geom = new ol.geom.Point(
                ol.proj.transform(enrichedData.geometry.coordinates, 'EPSG:4326', 'EPSG:3857')
            );
            point_feature.setGeometry(point_geom);
            point_feature.set('enrichedData', featureData);
            var vector_layer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: [point_feature]
                })
            })
            map.addLayer(vector_layer);
        })
        .error(function (e) {
            console.log(e);
        });
});