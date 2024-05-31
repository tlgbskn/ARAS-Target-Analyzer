document.addEventListener('DOMContentLoaded', function () {
    var positions = JSON.parse(localStorage.getItem('positions')) || [];
    var mevziMenzilleri = JSON.parse(localStorage.getItem('mevziMenzilleri')) || [];
    var positionSelect = document.getElementById('selectedPosition');
    var targetSelect = document.getElementById('selectedTarget');
    var weaponSystemInput = document.getElementById('weaponSystem');

    // Mevzi ve hedef seçeneklerini yükle
    positions.forEach(function (position) {
        var option = document.createElement('option');
        option.value = position.id;
        option.text = position.label;
        positionSelect.appendChild(option);
        targetSelect.appendChild(option.cloneNode(true)); // Hedef seçenekleri için de aynı seçenekleri kullan
    });

    // Mevzi seçimi değiştiğinde, ilgili silah sistemini göster
    positionSelect.addEventListener('change', function() {
        var selectedPositionId = this.value;
        var selectedMevzi = mevziMenzilleri.find(mevzi => mevzi.id == selectedPositionId);
        if (selectedMevzi && weaponSystemInput) {
            weaponSystemInput.value = selectedMevzi.name || '';
        } else {
            weaponSystemInput.value = ''; // Eğer mevzi bulunamazsa input alanını boş bırak
        }
    });

    // Form gönderildiğinde atış bilgilerini kaydet
    document.getElementById('shootingEntryForm').addEventListener('submit', function (event) {
        event.preventDefault();
        
        var selectedPosition = document.getElementById('selectedPosition');
        var selectedTarget = document.getElementById('selectedTarget');
        
        var shootingData = {
            positionId: selectedPosition.value,
            positionLabel: selectedPosition.options[selectedPosition.selectedIndex].text,
            weaponSystem: weaponSystemInput.value,
            targetId: selectedTarget.value,
            targetLabel: selectedTarget.options[selectedTarget.selectedIndex].text,
            shotRegion: document.getElementById('shotRegion').value,
            shotCount: document.getElementById('shotCount').value,
            distance: document.getElementById('distance').value,
            munitionType: document.getElementById('munitionType').value,
            angleDegree: document.getElementById('angleDegree').value,
            angleMils: document.getElementById('angleMils').value,
            hitResult: document.getElementById('hitResult').value
        };

        saveShootingData(shootingData);
    });

    document.getElementById('queryButton').addEventListener('click', function () {
        displayShootingData();
    });

    document.getElementById('exportButton').addEventListener('click', function () {
        exportShootingDataToExcel();
    });

    function saveShootingData(data) {
        var shootingDataList = JSON.parse(localStorage.getItem('shootingData')) || [];
        shootingDataList.push(data);
        localStorage.setItem('shootingData', JSON.stringify(shootingDataList));
        alert('Atış bilgisi kaydedildi!');
    }

    function displayShootingData() {
        var shootingDataList = JSON.parse(localStorage.getItem('shootingData')) || [];
        var tableBody = document.getElementById('shootingDataTable').querySelector('tbody');
        tableBody.innerHTML = '';

        shootingDataList.forEach(function (data) {
            var row = document.createElement('tr');
            row.innerHTML = `
                <td>${data.positionLabel}</td>
                <td>${data.weaponSystem}</td>
                <td>${data.targetLabel}</td>
                <td>${data.shotRegion}</td>
                <td>${data.shotCount}</td>
                <td>${data.distance}</td>
                <td>${data.munitionType}</td>
                <td>${data.angleDegree}</td>
                <td>${data.angleMils}</td>
                <td>${data.hitResult === 'hit' ? 'Vurdu' : 'Vurmadı'}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    function exportShootingDataToExcel() {
        var shootingDataList = JSON.parse(localStorage.getItem('shootingData')) || [];
        var worksheetData = [
            ["Mevzi", "Silah Sistemi", "Hedef", "Atış Bölgesi", "Atış Adedi", "Mesafe (m)", "Mühimmat Türü", "Atış Açısı (Derece)", "Atış Açısı (Milyem)", "Sonuç"]
        ];

        shootingDataList.forEach(function (data) {
            worksheetData.push([
                data.positionLabel,
                data.weaponSystem,
                data.targetLabel,
                data.shotRegion,
                data.shotCount,
                data.distance,
                data.munitionType,
                data.angleDegree,
                data.angleMils,
                data.hitResult === 'hit' ? 'Vurdu' : 'Vurmadı'
            ]);
        });

        var wb = XLSX.utils.book_new();
        var ws = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(wb, ws, "Atış Bilgileri");
        XLSX.writeFile(wb, "atis_bilgileri.xlsx");
    }
});
