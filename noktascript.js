document.addEventListener('DOMContentLoaded', function() {
    var map = L.map('mapid').setView([39.925533, 32.866287], 13);
    var mevziMenzilleri = [];
    var markers = [];
    var markerRange = 0;

    var satelliteLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var measureControl = L.control.measure({
        position: 'topleft',
        primaryLengthUnit: 'meters',
        secondaryLengthUnit: 'kilometers',
        primaryAreaUnit: 'sqmeters',
        secondaryAreaUnit: 'hectares',
        activeColor: '#db4a29',
        completedColor: '#9b2d14'
    }).addTo(map);

    L.Control.Measure.include({
        _setCaptureMarkerIcon: function() {
            this._captureMarker.options.autoPanOnFocus = false;
            this._captureMarker.setIcon(L.divIcon({
                iconSize: this._map.getSize().multiplyBy(2)
            }));
        },
    });

    var topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: 'Map data © <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
    });

    var baseMaps = {
        "Uydu Görüntüsü": satelliteLayer,
        "Topoğrafik Harita": topoLayer
    };

    L.control.layers(baseMaps).addTo(map);

    var weaponSystems = [
        { name: '120mm Havan', range: 8750, cost: 2000, effectiveness: 0.8, fireRate: 8, defense: 6 },
        { name: '81mm Havan', range: 5850, cost: 1500, effectiveness: 0.7, fireRate: 5, defense: 5 },
        { name: 'Fırtına Obüs', range: 40500, cost: 8000, effectiveness: 0.9, fireRate: 9, defense: 7 }
    ];

    function addMarker(latlng, type, label) {
        var color = {
            hedef: 'red',
            mevzii: 'blue',
            kisitlama: 'green'
        }[type];

        var iconHtml = `<div style='position: relative;'>
                            <div style='position: absolute; top: -24px; left: -50%; width: 100px; text-align: center; background-color: white; color: black; border-radius: 5px; padding: 2px;'>
                                ${label}
                            </div>
                            <div style='background-color:${color}; width:12px; height:12px; border-radius:50%;'></div>
                        </div>`;

        var marker = L.marker(latlng, {
            draggable: true,
            icon: L.divIcon({
                className: 'custom-div-icon',
                html: iconHtml,
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            })
        }).addTo(map);

        var id = markers.length + 1;
        marker.id = id;

        var popupContent = document.createElement('div');
        popupContent.innerHTML = `Type: ${type}<br>Coordinates: ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}<br>Label: ${label}`;
        if (type === 'mevzii') {
            var select = document.createElement('select');
            select.innerHTML = '<option value="">Select</option>';
            weaponSystems.forEach(function(system) {
                select.innerHTML += `<option value="${system.range}" data-cost="${system.cost}" data-effectiveness="${system.effectiveness}" data-fireRate="${system.fireRate}" data-name="${system.name}">${system.name}</option>`;
            });
            popupContent.appendChild(document.createElement('br'));
            popupContent.appendChild(select);

            select.addEventListener('change', function() {
                var selectedOption = select.options[select.selectedIndex];
                markerRange = parseInt(selectedOption.value, 10) || 0;
                var systemCost = parseFloat(selectedOption.getAttribute('data-cost')) || 0;
                var systemEffectiveness = parseFloat(selectedOption.getAttribute('data-effectiveness')) || 0;
                var systemFireRate = parseFloat(selectedOption.getAttribute('data-fireRate')) || 0;
                var systemName = selectedOption.getAttribute('data-name') || "";

                if (marker.circle) {
                    marker.circle.setRadius(markerRange);
                }

                mevziMenzilleri[id - 1] = { range: markerRange, cost: systemCost, effectiveness: systemEffectiveness, fireRate: systemFireRate, name: systemName };
            });
        }

        marker.bindPopup(popupContent);
        mevziMenzilleri[id - 1] = { range: markerRange, cost: 0, effectiveness: 0, fireRate: 0, name: "", label: label };

        var circleRadius = (type === 'kisitlama' ? 800 : 0);
        if (type === 'kisitlama' || type === 'mevzii') {
            var circle = L.circle(latlng, {
                color: 'black',
                fillColor: color,
                fillOpacity: 0.1,
                radius: circleRadius,
                dashArray: '10, 5',
                dashOffset: '0'
            }).addTo(map);
            marker.circle = circle;
        }

        marker.on('dragend', function() {
            var newLatLng = this.getLatLng();
            this.setLatLng(newLatLng).update();
            if (this.circle) {
                this.circle.setLatLng(newLatLng);
            }
            markers = markers.map(m => {
                if (m.marker === this) {
                    return { ...m, latlng: newLatLng };
                } else {
                    return m;
                }
            });
        });

        marker.on('contextmenu', function() {
            map.removeLayer(marker);
            if (marker.circle) {
                map.removeLayer(marker.circle);
            }
            markers = markers.filter(m => m.marker !== marker);
        });

        markers.push({marker: marker, type: type, label: label, latlng: latlng, circle: marker.circle, id: id});
        if (type === 'hedef') {
            updateTargetOptions();
        }
    }

    map.on('click', function(e) {
        var type = document.getElementById('manualType').value || 'hedef';
        var label = prompt("Enter label for marker:");
        if (label !== null && label !== "") {
            addMarker(e.latlng, type, label);
        }
    });

    document.getElementById('addManualMarkerBtn').addEventListener('click', function() {
        var lat = parseFloat(document.getElementById('latitude').value);
        var lng = parseFloat(document.getElementById('longitude').value);
        var type = document.getElementById('manualType').value;
        var label = document.getElementById('manualLabel').value;

        if (!lat || !lng || !label) {
            alert('Please fill in all fields and enter valid coordinates!');
            return;
        }

        var latlng = L.latLng(lat, lng);
        addMarker(latlng, type, label);
    });

    document.getElementById('deleteMarkerBtn').addEventListener('click', function() {
        if (markers.length > 0) {
            var lastMarker = markers.pop();
            map.removeLayer(lastMarker.marker);
            if (lastMarker.circle) {
                map.removeLayer(lastMarker.circle);
            }
        } else {
            alert("No marker to delete!");
        }
    });

    document.getElementById('exportButton').addEventListener('click', function() {
        exportToExcel(markers);
    });

    function updateTargetOptions() {
        var targetSelect = document.getElementById('targetSelection');
        targetSelect.innerHTML = '<option value="">Select Target</option>';

        markers.forEach(marker => {
            if (marker.type === 'hedef') {
                var option = document.createElement('option');
                option.value = marker.id;
                option.text = marker.label;
                targetSelect.appendChild(option);
            }
        });
    }

    function loadExcelData() {
        var fileInput = document.getElementById('fileInput');
        var reader = new FileReader();

        reader.onload = function(e) {
            var data = new Uint8Array(e.target.result);
            var workbook = XLSX.read(data, {type: 'array'});

            var firstSheetName = workbook.SheetNames[0];
            var worksheet = workbook.Sheets[firstSheetName];

            var rows = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            rows.forEach(function(row, index) {
                if (index > 0) {
                    var latitude = row[0];
                    var longitude = row[1];
                    var type = row[2];
                    var label = row[3];
                    var latLng = L.latLng(latitude, longitude);
                    addMarker(latLng, type, label);
                }
            });
        };

        reader.readAsArrayBuffer(fileInput.files[0]);
    }

    document.getElementById('fileInputButton').addEventListener('click', loadExcelData);

    function exportToExcel(markers) {
        var wb = XLSX.utils.book_new();
        var ws_name = "Coordinates and Relationships";

        var headers = ["ID", "Type", "Latitude", "Longitude", "Label"];
        var subHeaders = ["Distance (km)", "Angle (degrees)", "Direction (mils)", "Relative Direction"];

        var data = [headers.concat(subHeaders)];

        markers.forEach((marker, index) => {
            var row = [index + 1, marker.type, marker.latlng.lat, marker.latlng.lng, marker.label];
            markers.forEach(otherMarker => {
                if (['mevzii', 'kisitlama'].includes(marker.type) && otherMarker.type === 'hedef') {
                    var distance = haversineDistance(marker.latlng, otherMarker.latlng).toFixed(2);
                    var bearing = calculateBearing(marker.latlng, otherMarker.latlng);
                    var mils = degreesToMils(bearing);
                    var direction = getDirectionFromBearing(bearing);
                    row.push(distance, bearing.toFixed(2), mils, direction);
                }
            });

            data.push(row);
        });

        var ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, ws_name);
        XLSX.writeFile(wb, "coordinates_and_relationships.xlsx");
    }

    window.analyzeTargets = function() {
        var selectedTargetId = document.getElementById('targetSelection').value;
        if (!selectedTargetId) {
            alert('Please select a target.');
            return;
        }

        var selectedTarget = markers.find(marker => marker.id == selectedTargetId);
        if (!selectedTarget) {
            alert('Selected target not found.');
            return;
        }

        var results = [];
        markers.forEach(marker => {
            if (marker.type === 'mevzii') {
                var markerRange = mevziMenzilleri[marker.id - 1].range || 0;
                var distance = haversineDistance(marker.latlng, selectedTarget.latlng);

                var canShoot = markerRange !== undefined && distance <= markerRange;
                var isRestricted = markers.some(restriction => {
                    return restriction.type === 'kisitlama' && haversineDistance(restriction.latlng, selectedTarget.latlng) <= 800;
                });

                if (canShoot && !isRestricted) {
                    results.push({ id: marker.id, canShoot: true, label: marker.label, distance: distance });
                } else {
                    results.push({ id: marker.id, canShoot: false, label: marker.label, distance: distance });
                }
            }
        });

        if (results.length === 0) {
            alert('No positions or cannot shoot at the target.');
        } else {
            visualizeShootingResults(results);
        }
    }

    function exportResultsToExcel(results) {
        var wb = XLSX.utils.book_new();
        var ws_name = "Shooting Analysis Results";
        var headers = ["Position ID", "Position Label", "Can Shoot"];
        var data = [headers];

        results.forEach(result => {
            var marker = markers.find(m => m.id === result.id);
            var row = [result.id, marker ? marker.label : "", result.canShoot ? "Yes" : "No"];
            data.push(row);
        });

        var ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, ws_name);
        XLSX.writeFile(wb, "shooting_analysis_results.xlsx");
    }

    function haversineDistance(coords1, coords2) {
        function toRad(x) {
            return x * Math.PI / 180;
        }

        var lat1 = coords1.lat;
        var lon1 = coords1.lng;
        var lat2 = coords2.lat;
        var lon2 = coords2.lng;

        var R = 6371000; // Earth's radius in meters
        var dLat = toRad(lat2 - lat1);
        var dLon = toRad(lon2 - lon1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function calculateBearing(coords1, coords2) {
        function toRad(x) {
            return x * Math.PI / 180;
        }
        var y = Math.sin(toRad(coords2.lng - coords1.lng)) * Math.cos(toRad(coords2.lat));
        var x = Math.cos(toRad(coords1.lat)) * Math.sin(toRad(coords2.lat)) -
                Math.sin(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) * Math.cos(toRad(coords2.lng - coords1.lng));
        var brng = Math.atan2(y, x);
        return (brng * (180 / Math.PI) + 360) % 360;
    }

    function degreesToMils(degrees) {
        return (degrees * (6400 / 360)).toFixed(0);
    }

    function getDirectionFromBearing(bearing) {
        if (bearing >= 337.5 || bearing < 22.5) {
            return "N";
        } else if (bearing >= 22.5 && bearing < 67.5) {
            return "NE";
        } else if (bearing >= 67.5 && bearing < 112.5) {
            return "E";
        } else if (bearing >= 112.5 && bearing < 157.5) {
            return "SE";
        } else if (bearing >= 157.5 && bearing < 202.5) {
            return "S";
        } else if (bearing >= 202.5 && bearing < 247.5) {
            return "SW";
        } else if (bearing >= 247.5 && bearing < 292.5) {
            return "W";
        } else if (bearing >= 292.5 && bearing < 337.5) {
            return "NW";
        }
    }

    var arrows = [];
    function drawArrow(fromLatlng, toLatlng, color='red', arrowSize=10, lineLength=40, dashArray='10, 5', dashOffset='0') {
        var polyline = L.polyline([fromLatlng, L.latLng(
            fromLatlng.lat + (toLatlng.lat - fromLatlng.lat) * (lineLength / 100),
            fromLatlng.lng + (toLatlng.lng - fromLatlng.lng) * (lineLength / 100)
        )], {
            color: color,
            dashArray: dashArray,
            dashOffset: dashOffset
        }).addTo(map);

        var arrowHead = L.polylineDecorator(polyline, {
            patterns: [
                {offset: '100%', repeat: 0, symbol: L.Symbol.arrowHead({pixelSize: arrowSize, polygon: false, pathOptions: {stroke: true, color: color, className: 'arrow-head'}})}
            ]
        }).addTo(map);

        arrows.push({ polyline: polyline, arrowHead: arrowHead });
    }

    function drawAllArrows() {
        markers.forEach(marker => {
            if (marker.type === 'mevzii') {
                markers.forEach(target => {
                    if (target.type === 'hedef') {
                        drawArrow(marker.latlng, target.latlng, 'red', 5, 50, '10, 5', '0');
                    }
                });
            }
        });
    }

    document.getElementById('drawArrowsBtn').addEventListener('click', drawAllArrows);

    function clearArrows() {
        arrows.forEach(function(arrow) {
            map.removeLayer(arrow.polyline);
            map.removeLayer(arrow.arrowHead);
        });
        arrows = [];
    }
    document.getElementById('clearArrowsBtn').addEventListener('click', clearArrows);

    function visualizeShootingResults(results) {
        results.forEach(result => {
            var marker = markers.find(m => m.id === result.id);
            if (marker) {
                var color = result.canShoot ? 'green' : 'red';
                marker.circle.setStyle({color: color, fillColor: color});
            }
        });

        // Export results to Excel
        exportResultsToExcel(results);
    }

    function visualizePrioritization(results) {
        // Add priority numbers to the markers based on ARAS ranking
        results.sort((a, b) => b.totalScore - a.totalScore || a.distance - b.distance).forEach((result, index) => {
            var marker = markers.find(m => m.id === result.id);
            if (marker) {
                var priorityIconHtml = `<div style='position: relative;'>
                                            <div style='background-color: yellow; color: black; font-weight: bold; border-radius: 50%; width: 24px; height: 24px; text-align: center; line-height: 24px;'>${index + 1}</div>
                                        </div>`;
                marker.marker.setIcon(L.divIcon({
                    className: 'custom-div-icon',
                    html: priorityIconHtml,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                }));
            }
        });

        // Add link to open ARAS results in a new tab
        const resultsLink = document.createElement('a');
        resultsLink.href = 'aras_results.html';
        resultsLink.target = '_blank';
        resultsLink.textContent = 'View Detailed ARAS Results';
        resultsLink.style.display = 'block';
        resultsLink.style.marginTop = '10px';
        resultsLink.style.color = '#007bff';
        resultsLink.style.textDecoration = 'underline';

        const resultsDiv = document.getElementById('results');
        resultsDiv.appendChild(resultsLink);

        // Save results to local storage to pass to the new tab
        localStorage.setItem('arasResults', JSON.stringify(results));
    }

    function clearVisualizationResults() {
        markers.forEach(marker => {
            if (marker.circle) {
                var defaultColor = marker.type === 'mevzii' ? 'blue' : marker.type === 'kisitlama' ? 'green' : 'gray';
                marker.circle.setStyle({
                    color: defaultColor,
                    fillColor: defaultColor
                });

                var iconHtml = `<div style='position: relative;'>
                                    <div style='position: absolute; top: -24px; left: -50%; width: 100px; text-align: center; background-color: white; color: black; border-radius: 5px; padding: 2px;'>
                                        ${marker.label}
                                    </div>
                                    <div style='background-color:${defaultColor}; width:12px; height:12px; border-radius:50%;'></div>
                                </div>`;
                marker.marker.setIcon(L.divIcon({
                    className: 'custom-div-icon',
                    html: iconHtml,
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                }));
            }
        });

        const resultsLink = document.querySelector('#results a');
        if (resultsLink) {
            resultsLink.remove();
        }
    }

    document.getElementById('clearResultsBtn').addEventListener('click', clearVisualizationResults);

    // Update criteria weights
    document.getElementById('updateCriteriaBtn').addEventListener('click', function() {
        criteriaWeights.cost = parseFloat(document.getElementById('costWeight').value);
        criteriaWeights.range = parseFloat(document.getElementById('rangeWeight').value);
        criteriaWeights.effectiveness = parseFloat(document.getElementById('effectivenessWeight').value);
        criteriaWeights.fireRate = parseFloat(document.getElementById('fireRateWeight').value);
        alert('Criteria weights updated.');
    });

    // Criteria weights
    const criteriaWeights = {
        cost: 0.25,
        range: 0.25,
        effectiveness: 0.25,
        fireRate: 0.25
    };

    // Calculate total score using ARAS method
    function calculateARAS(scores, weights) {
        return scores.map(score => {
            const totalScore = Object.keys(weights).reduce((sum, criterion) => {
                if (criterion === 'cost' || criterion === 'range') {
                    return sum - score[criterion] * weights[criterion];
                } else {
                    return sum + score[criterion] * weights[criterion];
                }
            }, 0);
            return { id: score.id, totalScore: totalScore, name: score.name, distance: score.distance, label: score.label };
        });
    }

    // Function to get scores of positions that can shoot at the selected target
    function getShootableMevziScores(selectedTarget) {
        return markers.filter(marker => {
            if (marker.type === 'mevzii') {
                var markerRange = mevziMenzilleri[marker.id - 1].range || 0;
                var distance = haversineDistance(marker.latlng, selectedTarget.latlng);
                return markerRange !== undefined && distance <= markerRange;
            }
            return false;
        }).map(marker => {
            var id = marker.id;
            var range = mevziMenzilleri[id - 1].range || 0;
            var cost = mevziMenzilleri[id - 1].cost || 0;
            var effectiveness = mevziMenzilleri[id - 1].effectiveness || 0;
            var fireRate = mevziMenzilleri[id - 1].fireRate || 0;
            var name = mevziMenzilleri[id - 1].name || "";
            var distance = haversineDistance(marker.latlng, selectedTarget.latlng);  // Calculate distance here
            return { id, range, cost, effectiveness, fireRate, name, distance: distance, label: marker.label };
        });
    }

    // Updated function to analyze targets and rank the shootable positions
    document.getElementById('analyzeButton').addEventListener('click', function() {
        const selectedTargetId = document.getElementById('targetSelection').value;
        const selectedTarget = markers.find(marker => marker.id == selectedTargetId);
        if (!selectedTarget) {
            alert('Selected target not found.');
            return;
        }

        const mevziScores = getShootableMevziScores(selectedTarget);
        const rankedMevzis = calculateARAS(mevziScores, criteriaWeights);

        // Sorting by score and then by distance for those with the same score
        const finalRankedMevzis = rankedMevzis.sort((a, b) => {
            if (b.totalScore === a.totalScore) {
                return a.distance - b.distance;
            } else {
                return b.totalScore - a.totalScore;
            }
        });

        // Visualize the results of the ARAS method on the map
        visualizePrioritization(finalRankedMevzis);
    });
});
