// app.js - Main application logic
// ====================== BIẾN TOÀN CỤC ======================
let editingRow = null;
let editingField = null;
let isInitialized = false;

// Lấy tham chiếu đến HealthData từ data.js
const HealthData = window.HealthData;

// ====================== KHỞI TẠO TRANG ======================
document.addEventListener('DOMContentLoaded', function() {
    if (isInitialized) return;
    
    // Khởi tạo dữ liệu từ data.js
    HealthData.initializeData();
    
    // Khởi tạo giao diện
    initUI();
    
    // Hiển thị dữ liệu ban đầu
    displayData();
    updateStatistics();
    updateNearestFutureNotification();
    updateUpcomingEventsWarning();
    updateFooterInfo();
    
    // Thiết lập sự kiện
    setupEventListeners();
    
    // Khởi tạo chức năng copy
    initCopyFunctionality();
    
    isInitialized = true;
    
    // Hiển thị thông báo chào mừng
    setTimeout(() => {
        showToast('success', 'Hệ thống đã sẵn sàng', `Đã tải ${HealthData.healthData().length} bản ghi từ cơ sở dữ liệu`);
    }, 1000);
});

// Khởi tạo giao diện
function initUI() {
    // Thiết lập ngày hiện tại cho bộ lọc
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = today;
    
    // Khởi tạo dropdown lọc
    initFilterDropdowns();
    
    // Khởi tạo số bản ghi mỗi trang
    document.getElementById('itemsPerPage').value = HealthData.itemsPerPage.toString();
}

// Khởi tạo dropdown lọc
function initFilterDropdowns() {
    const nameFilter = document.getElementById('filterName');
    const symptomFilter = document.getElementById('filterSymptom');
    
    // Clear existing options
    nameFilter.innerHTML = '<option value="">Tất cả</option>';
    symptomFilter.innerHTML = '<option value="">Tất cả</option>';
    
    // Thêm tên
    HealthData.allNames().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        nameFilter.appendChild(option);
    });
    
    // Thêm triệu chứng
    HealthData.allSymptoms().forEach(symptom => {
        const option = document.createElement('option');
        option.value = symptom;
        option.textContent = symptom.length > 30 ? symptom.substring(0, 30) + "..." : symptom;
        option.title = symptom;
        symptomFilter.appendChild(option);
    });
}

// Thiết lập sự kiện
function setupEventListeners() {
    // Tính toán tự động
    document.getElementById('inputEventDate').addEventListener('input', function() {
        const dayOrder = HealthData.calculateDayOrder(this.value);
        document.getElementById('outputDaySeq').value = dayOrder || '';
    });

    document.getElementById('inputTime').addEventListener('input', function() {
        const timeOrder = HealthData.calculateTimeOrder(this.value);
        document.getElementById('outputHourSeq').value = timeOrder || '';
    });

    // Nút thêm dòng mới
    document.getElementById('addNewRowBtn').addEventListener('click', function() {
        if (HealthData.addNewRecord()) {
            // Reset form
            HealthData.clearForm();
            
            // Cập nhật giao diện
            HealthData.currentPage = 1;
            HealthData.calculatePagination();
            displayData();
            updateStatistics();
            updateNearestFutureNotification();
            updateUpcomingEventsWarning();
            initFilterDropdowns();
            
            showToast('success', 'Thành công', 'Đã thêm bản ghi mới');
        }
    });

    // Nút tính toán lại
    document.getElementById('calculateAllBtn').addEventListener('click', function() {
        HealthData.updateCalculations();
        displayData();
        updateStatistics();
        updateNearestFutureNotification();
        updateUpcomingEventsWarning();
        showToast('success', 'Tính toán', 'Đã tính toán lại toàn bộ dữ liệu');
    });

    // Nút lưu dữ liệu
    document.getElementById('saveAllDataBtn').addEventListener('click', function() {
        if (HealthData.saveDataToStorage()) {
            showToast('success', 'Lưu dữ liệu', 'Đã lưu toàn bộ dữ liệu thành công');
        }
    });

    // Nút tải dữ liệu mẫu
    document.getElementById('loadSampleDataBtn').addEventListener('click', function() {
        if (confirm('Tải dữ liệu mẫu sẽ thay thế dữ liệu hiện tại. Bạn có chắc chắn?')) {
            const sampleData = HealthData.getSampleData();
            HealthData.healthData = sampleData;
            HealthData.filteredData = [...sampleData];
            displayData();
            updateStatistics();
            updateNearestFutureNotification();
            HealthData.extractUniqueValues();
            initFilterDropdowns();
            HealthData.saveDataToStorage();
            showToast('success', 'Tải dữ liệu mẫu', 'Đã tải dữ liệu mẫu thành công');
        }
    });

    // Nút xuất dữ liệu
    document.getElementById('exportDataBtn').addEventListener('click', function() {
        exportData();
    });

    // Nút nhập dữ liệu
    document.getElementById('importDataBtn').addEventListener('click', function() {
        document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', function(e) {
        if (e.target.files[0]) {
            importData(e.target.files[0]);
        }
    });

    // Bộ lọc
    document.getElementById('applyFilterBtn').addEventListener('click', applyFilters);
    document.getElementById('resetFilterBtn').addEventListener('click', resetFilters);
    document.getElementById('advancedFilterBtn').addEventListener('click', showAdvancedFilterModal);

    // Phân trang
    document.getElementById('prevPageBtn').addEventListener('click', goToPrevPage);
    document.getElementById('nextPageBtn').addEventListener('click', goToNextPage);
    document.getElementById('itemsPerPage').addEventListener('change', function() {
        HealthData.itemsPerPage = parseInt(this.value);
        HealthData.currentPage = 1;
        HealthData.calculatePagination();
        displayData();
    });

    // Chọn hàng
    document.getElementById('selectAllCheckbox').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = this.checked;
            const rowId = parseInt(cb.dataset.rowId);
            if (this.checked) {
                HealthData.selectedRows.add(rowId);
            } else {
                HealthData.selectedRows.delete(rowId);
            }
        });
        updateSelectedActions();
    });

    document.getElementById('selectAllBtn').addEventListener('click', function() {
        document.getElementById('selectAllCheckbox').click();
    });

    document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelectedRows);
    document.getElementById('exportSelectedBtn').addEventListener('click', exportSelectedRows);

    // Copy text
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('copyable')) {
            copyTextToClipboard(e.target.textContent || e.target.value);
        }
    });

    // Modal nâng cao
    document.getElementById('closeAdvancedFilterBtn').addEventListener('click', closeAdvancedFilterModal);
    document.getElementById('cancelAdvancedFilterBtn').addEventListener('click', closeAdvancedFilterModal);
    document.getElementById('applyAdvancedFilterBtn').addEventListener('click', applyAdvancedFilters);

    // Quản lý dữ liệu
    document.getElementById('exportFullDataBtn').addEventListener('click', function() {
        exportData(HealthData.healthData(), `vanhan_full_data_${new Date().toISOString().split('T')[0]}.json`);
    });

    // Cài đặt hệ thống
    document.getElementById('autoSaveCheckbox').addEventListener('change', function() {
        localStorage.setItem('autoSave', this.checked);
    });

    document.getElementById('showNotificationsCheckbox').addEventListener('change', function() {
        localStorage.setItem('showNotifications', this.checked);
    });

    document.getElementById('enableSoundCheckbox').addEventListener('change', function() {
        localStorage.setItem('enableSound', this.checked);
    });

    // Tải cài đặt
    loadSettings();
}

// ====================== HIỂN THỊ DỮ LIỆU ======================
function displayData() {
    const tableBody = document.getElementById('mainDataBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (HealthData.filteredData().length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="26" style="text-align: center; padding: 40px; color: #999;">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                Không tìm thấy dữ liệu phù hợp với bộ lọc
            </td>
        `;
        tableBody.appendChild(row);
        updatePaginationInfo();
        return;
    }
    
    // Lấy dữ liệu phân trang
    const pageData = HealthData.getPaginatedData();
    const startIndex = (HealthData.currentPage - 1) * HealthData.itemsPerPage;
    
    const now = new Date();
    
    pageData.forEach((item, index) => {
        const globalIndex = startIndex + index;
        const row = document.createElement('tr');
        
        // Tính toán các giá trị
        const daySequence = HealthData.calculateDayOrder(item.eventDate);
        const hourSequence = HealthData.calculateTimeOrder(item.time);
        const pastDate = HealthData.calculatePastDate(item.eventDate, item.sequence);
        const pastTime = HealthData.calculatePastTime(item.time, item.sequence);
        const futureDate = HealthData.calculateFutureDate(item.eventDate, item.sequence);
        const futureTime = HealthData.calculateFutureTime(item.time, item.sequence);
        const futureDateTime = HealthData.getFutureDateTime(futureDate, futureTime);
        const remainingDays = HealthData.calculateRemainingDays(now, futureDateTime);
        const remainingHours = HealthData.calculateRemainingHours(now, futureDateTime);
        const solarTerm = HealthData.getSolarTermByDate(HealthData.parseDate(item.eventDate));
        
        // Xác định trạng thái
        const status = HealthData.getStatus(remainingDays);
        const statusText = HealthData.getStatusText(status);
        const statusClass = HealthData.getStatusClass(status);
        
        // Xác định class cho hàng
        const rowClass = `${statusClass}-row`;
        
        // Xác định class cho mùa
        const seasonClass = item.season ? item.season.toLowerCase() : '';
        
        // Tạo các badge
        const birthDateBadge = item.birthDate ? `<span class="badge-date">${item.birthDate}</span>` : '<span class="empty-cell">Nhập</span>';
        const eventDateBadge = item.eventDate ? `<span class="badge-date">${item.eventDate}</span>` : '<span class="empty-cell">Nhập</span>';
        const badDateBadge = item.badDate ? `<span class="badge-date">${item.badDate}</span>` : '<span class="empty-cell">Nhập</span>';
        const daySequenceBadge = daySequence ? `<span class="badge-sequence" style="background-color: #3498db;">${daySequence}</span>` : '<span class="empty-cell">Nhập</span>';
        const lunarDateBadge = item.lunarDate && item.lunarDate !== "#N/A" ? `<span class="badge-date">${item.lunarDate}</span>` : '<span class="empty-cell">Nhập</span>';
        const seasonBadge = item.season && item.season !== "#N/A" ? `<span class="badge-season ${seasonClass}">${item.season}</span>` : '<span class="empty-cell">Nhập</span>';
        const hourSequenceBadge = hourSequence ? `<span class="badge-sequence" style="background-color: #e74c3c;">${hourSequence}</span>` : '<span class="empty-cell">Nhập</span>';
        const timeBadge = item.time ? `<span class="badge-time">${item.time}</span>` : '<span class="empty-cell">Nhập</span>';
        const sequenceBadge = item.sequence ? `<span class="badge-sequence">${item.sequence}</span>` : '<span class="empty-cell">Nhập</span>';
        const nameBadge = item.name ? `<span class="badge-name">${item.name}</span>` : '<span class="empty-cell">Nhập</span>';
        const symptomBadge = item.symptom ? `<span class="badge-symptom">${item.symptom}</span>` : '<span class="empty-cell">Nhập</span>';
        const eatEastBadge = item.eatEast ? `<span class="badge-food">${item.eatEast}</span>` : '<span class="empty-cell">Nhập</span>';
        const eatWestBadge = item.eatWest ? `<span class="badge-food" style="background-color: #e67e22;">${item.eatWest}</span>` : '<span class="empty-cell">Nhập</span>';
        const eatNorthSouthBadge = item.eatNorthSouth ? `<span class="badge-food" style="background-color: #1abc9c;">${item.eatNorthSouth}</span>` : '<span class="empty-cell">Nhập</span>';
        
        // Kiểm tra nếu là hàng hiện tại (ngày hôm nay)
        const itemDate = HealthData.parseDate(item.eventDate);
        const isCurrent = itemDate && itemDate.toDateString() === now.toDateString();
        
        row.className = rowClass;
        if (isCurrent) row.classList.add('current-row');
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="row-checkbox" data-row-id="${item.id}" 
                       ${HealthData.selectedRows.has(item.id) ? 'checked' : ''}
                       onchange="toggleRowSelection(${item.id}, this.checked)">
            </td>
            <td>${globalIndex + 1}</td>
            <td onclick="editCell(${globalIndex}, 'birthDate')">${birthDateBadge}</td>
            <td onclick="editCell(${globalIndex}, 'badDate')">${badDateBadge}</td>
            <td>${daySequenceBadge}</td>
            <td onclick="editCell(${globalIndex}, 'eventDate')">${eventDateBadge}</td>
            <td onclick="editCell(${globalIndex}, 'lunarDate')">${lunarDateBadge}</td>
            <td onclick="editCell(${globalIndex}, 'season')">${seasonBadge}</td>
            <td>${hourSequenceBadge}</td>
            <td onclick="editCell(${globalIndex}, 'time')">${timeBadge}</td>
            <td onclick="editCell(${globalIndex}, 'sequence')">${sequenceBadge}</td>
            <td onclick="editCell(${globalIndex}, 'name')">${nameBadge}</td>
            <td onclick="editCell(${globalIndex}, 'symptom')">${symptomBadge}</td>
            <td><span class="badge-symptom" style="background-color: #8e44ad;">${solarTerm}</span></td>
            <td onclick="editCell(${globalIndex}, 'eatEast')">${eatEastBadge}</td>
            <td onclick="editCell(${globalIndex}, 'eatWest')">${eatWestBadge}</td>
            <td onclick="editCell(${globalIndex}, 'eatNorthSouth')">${eatNorthSouthBadge}</td>
            <td><span class="past-date-badge">${pastDate}</span></td>
            <td><span class="past-time-badge">${pastTime}</span></td>
            <td><span class="future-date-badge">${futureDate}</span></td>
            <td><span class="future-time-badge">${futureTime}</span></td>
            <td><span class="remaining-days-badge">${remainingDays}</span></td>
            <td><span class="remaining-hours-badge">${remainingHours}</span></td>
            <td><span class="status-badge status-${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editRecord(${item.id})" title="Sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteRow(${item.id})" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="action-btn view" onclick="viewDetails(${item.id})" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    updatePaginationInfo();
    updateSelectedActions();
}

// Cập nhật thông tin phân trang
function updatePaginationInfo() {
    const totalItems = HealthData.filteredData().length;
    const startItem = (HealthData.currentPage - 1) * HealthData.itemsPerPage + 1;
    const endItem = Math.min(HealthData.currentPage * HealthData.itemsPerPage, totalItems);
    
    document.getElementById('currentCount').textContent = endItem - startItem + 1;
    document.getElementById('totalCount').textContent = totalItems;
    document.getElementById('currentPage').textContent = HealthData.currentPage;
    document.getElementById('totalPages').textContent = HealthData.totalPages;
    
    document.getElementById('prevPageBtn').disabled = HealthData.currentPage <= 1;
    document.getElementById('nextPageBtn').disabled = HealthData.currentPage >= HealthData.totalPages;
}

function goToPrevPage() {
    if (HealthData.currentPage > 1) {
        HealthData.currentPage--;
        displayData();
    }
}

function goToNextPage() {
    if (HealthData.currentPage < HealthData.totalPages) {
        HealthData.currentPage++;
        displayData();
    }
}

// ====================== QUẢN LÝ DỮ LIỆU ======================
function editCell(index, field) {
    if (editingRow !== null && editingField !== null) {
        saveEdit();
    }
    
    const tableBody = document.getElementById('mainDataBody');
    const row = tableBody.children[index];
    const cellIndex = getCellIndexByField(field);
    const cell = row.cells[cellIndex];
    
    // Tìm item tương ứng trong filteredData
    const pageData = HealthData.getPaginatedData();
    const item = pageData[index];
    const currentValue = item[field] || '';
    
    let inputHtml = '';
    if (field === 'season') {
        inputHtml = `
            <select class="table-input" onblur="saveEdit()" onkeypress="if(event.key === 'Enter') saveEdit()">
                <option value="">Chọn mùa</option>
                <option value="Xuân" ${currentValue === 'Xuân' ? 'selected' : ''}>Xuân</option>
                <option value="Hạ" ${currentValue === 'Hạ' ? 'selected' : ''}>Hạ</option>
                <option value="Thu" ${currentValue === 'Thu' ? 'selected' : ''}>Thu</option>
                <option value="Đông" ${currentValue === 'Đông' ? 'selected' : ''}>Đông</option>
            </select>
        `;
    } else {
        inputHtml = `<input type="text" class="table-input" value="${currentValue}" 
                       onblur="saveEdit()" onkeypress="if(event.key === 'Enter') saveEdit()">`;
    }
    
    cell.innerHTML = inputHtml;
    const input = cell.querySelector('.table-input');
    if (input) input.focus();
    
    editingRow = index;
    editingField = field;
}

function getCellIndexByField(field) {
    const fieldMap = {
        'birthDate': 2,
        'badDate': 3,
        'eventDate': 5,
        'lunarDate': 6,
        'season': 7,
        'time': 9,
        'sequence': 10,
        'name': 11,
        'symptom': 12,
        'eatEast': 14,
        'eatWest': 15,
        'eatNorthSouth': 16
    };
    return fieldMap[field] || 0;
}

function saveEdit() {
    if (editingRow === null || editingField === null) return;
    
    const tableBody = document.getElementById('mainDataBody');
    const row = tableBody.children[editingRow];
    const cell = row.cells[getCellIndexByField(editingField)];
    const input = cell.querySelector('.table-input, select');
    if (!input) return;
    
    const newValue = input.value;
    
    // Lấy item từ pageData
    const pageData = HealthData.getPaginatedData();
    const item = pageData[editingRow];
    
    // Cập nhật dữ liệu
    item[editingField] = newValue;
    
    // Tìm và cập nhật trong healthData
    const originalIndex = HealthData.healthData().findIndex(hItem => hItem.id === item.id);
    if (originalIndex !== -1) {
        HealthData.healthData()[originalIndex][editingField] = newValue;
    }
    
    // Hiển thị lại dữ liệu
    displayData();
    
    // Reset biến chỉnh sửa
    editingRow = null;
    editingField = null;
    
    // Lưu dữ liệu
    HealthData.saveDataToStorage();
    showToast('success', 'Thành công', 'Đã cập nhật dữ liệu');
}

function editRecord(id) {
    const item = HealthData.healthData().find(item => item.id === id);
    if (!item) return;
    
    // Điền dữ liệu vào form
    document.getElementById('inputBirthDate').value = item.birthDate || '';
    document.getElementById('inputEventDate').value = item.eventDate || '';
    document.getElementById('inputBadDate').value = item.badDate || '';
    document.getElementById('inputLunarDate').value = item.lunarDate || '';
    document.getElementById('inputSeason').value = item.season || '';
    document.getElementById('inputTime').value = item.time || '';
    document.getElementById('inputSequence').value = item.sequence || '';
    document.getElementById('inputName').value = item.name || '';
    document.getElementById('inputSymptom').value = item.symptom || '';
    document.getElementById('inputEatEast').value = item.eatEast || '';
    document.getElementById('inputEatWest').value = item.eatWest || '';
    document.getElementById('inputEatNorthSouth').value = item.eatNorthSouth || '';
    document.getElementById('outputDaySeq').value = HealthData.calculateDayOrder(item.eventDate) || '';
    document.getElementById('outputHourSeq').value = HealthData.calculateTimeOrder(item.time) || '';
    
    showToast('info', 'Chỉnh sửa', 'Đã tải dữ liệu vào form chỉnh sửa');
}

function deleteRow(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa dòng này?")) return;
    
    // Tìm và xóa item
    const itemIndex = HealthData.healthData().findIndex(item => item.id === id);
    if (itemIndex === -1) return;
    
    // Xóa khỏi healthData
    HealthData.healthData().splice(itemIndex, 1);
    
    // Xóa khỏi selectedRows nếu có
    HealthData.selectedRows.delete(id);
    
    // Cập nhật filteredData
    const filterIndex = HealthData.filteredData().findIndex(item => item.id === id);
    if (filterIndex !== -1) {
        HealthData.filteredData().splice(filterIndex, 1);
    }
    
    // Cập nhật giao diện
    displayData();
    updateStatistics();
    updateNearestFutureNotification();
    updateUpcomingEventsWarning();
    HealthData.extractUniqueValues();
    initFilterDropdowns();
    
    // Lưu dữ liệu
    HealthData.saveDataToStorage();
    showToast('success', 'Thành công', 'Đã xóa bản ghi');
}

function viewDetails(id) {
    const item = HealthData.healthData().find(item => item.id === id);
    if (!item) return;
    
    // Tính toán các giá trị
    const pastDate = HealthData.calculatePastDate(item.eventDate, item.sequence);
    const pastTime = HealthData.calculatePastTime(item.time, item.sequence);
    const futureDate = HealthData.calculateFutureDate(item.eventDate, item.sequence);
    const futureTime = HealthData.calculateFutureTime(item.time, item.sequence);
    const futureDateTime = HealthData.getFutureDateTime(futureDate, futureTime);
    const remainingDays = HealthData.calculateRemainingDays(new Date(), futureDateTime);
    const remainingHours = HealthData.calculateRemainingHours(new Date(), futureDateTime);
    const status = HealthData.getStatusText(HealthData.getStatus(remainingDays));
    const solarTerm = HealthData.getSolarTermByDate(HealthData.parseDate(item.eventDate));
    
    const details = `
        <div style="font-size: 14px; line-height: 1.6; max-width: 500px;">
            <h3 style="color: #3498db; margin-top: 0;">Chi tiết bản ghi</h3>
            <p><strong>Tên:</strong> ${item.name || 'Không có'}</p>
            <p><strong>Ngày sinh:</strong> ${item.birthDate || 'Không có'}</p>
            <p><strong>Ngày vận hạn:</strong> ${item.eventDate || 'Không có'}</p>
            <p><strong>Ngày xấu:</strong> ${item.badDate || 'Không có'}</p>
            <p><strong>Mùa:</strong> ${item.season || 'Không có'}</p>
            <p><strong>Triệu chứng:</strong> ${item.symptom || 'Không có'}</p>
            <p><strong>Ăn Đông:</strong> ${item.eatEast || 'Không có'}</p>
            <p><strong>Ăn Tây:</strong> ${item.eatWest || 'Không có'}</p>
            <p><strong>Ăn Bắc/Nam:</strong> ${item.eatNorthSouth || 'Không có'}</p>
            <hr>
            <p><strong>Ngày trước đây:</strong> ${pastDate}</p>
            <p><strong>Giờ trước đây:</strong> ${pastTime}</p>
            <p><strong>Ngày sắp tới:</strong> ${futureDate}</p>
            <p><strong>Giờ sắp tới:</strong> ${futureTime}</p>
            <p><strong>Còn lại:</strong> ${remainingDays} ngày, ${remainingHours} giờ</p>
            <p><strong>Trạng thái:</strong> ${status}</p>
            <p><strong>Tiết khí:</strong> ${solarTerm}</p>
            <hr>
            <p><strong>Ngày tạo:</strong> ${new Date().toLocaleString('vi-VN')}</p>
        </div>
    `;
    
    // Tạo modal để hiển thị
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.right = '0';
    modal.style.bottom = '0';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.zIndex = '9999';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    modal.innerHTML = `
        <div class="modal" style="background: white; padding: 20px; border-radius: 8px; max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; color: #3498db;">Chi tiết bản ghi</h3>
                <button class="modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                ${details}
            </div>
            <div class="modal-footer" style="margin-top: 20px; text-align: right;">
                <button style="padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;" onclick="this.closest('.modal-overlay').remove()">Đóng</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ====================== QUẢN LÝ HÀNG CHỌN ======================
function toggleRowSelection(id, checked) {
    if (checked) {
        HealthData.selectedRows.add(id);
    } else {
        HealthData.selectedRows.delete(id);
        document.getElementById('selectAllCheckbox').checked = false;
    }
    updateSelectedActions();
}

function updateSelectedActions() {
    const hasSelection = HealthData.selectedRows.size > 0;
    document.getElementById('deleteSelectedBtn').style.display = hasSelection ? 'inline-flex' : 'none';
    document.getElementById('exportSelectedBtn').style.display = hasSelection ? 'inline-flex' : 'none';
    document.getElementById('copySelectedRowsBtn').style.display = hasSelection ? 'inline-flex' : 'none';
    document.getElementById('copySelectedBtn').style.display = hasSelection ? 'inline-flex' : 'none';
}

function deleteSelectedRows() {
    if (!HealthData.selectedRows.size) return;
    
    if (!confirm(`Bạn có chắc muốn xóa ${HealthData.selectedRows.size} bản ghi đã chọn?`)) return;
    
    // Xóa các bản ghi đã chọn
    HealthData.deleteSelectedRows();
    
    // Cập nhật giao diện
    displayData();
    updateStatistics();
    updateNearestFutureNotification();
    updateUpcomingEventsWarning();
    initFilterDropdowns();
    
    showToast('success', 'Thành công', `Đã xóa ${HealthData.selectedRows.size} bản ghi`);
}

function exportSelectedRows() {
    if (!HealthData.selectedRows.size) return;
    
    const selectedData = HealthData.healthData().filter(item => HealthData.selectedRows.has(item.id));
    exportData(selectedData, `vanhan_selected_${HealthData.selectedRows.size}_${new Date().toISOString().split('T')[0]}.json`);
}

// ====================== BỘ LỌC ======================
function applyFilters() {
    const filters = {
        name: document.getElementById('filterName').value,
        season: document.getElementById('filterSeason').value,
        symptom: document.getElementById('filterSymptom').value,
        status: document.getElementById('filterStatus').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value
    };
    
    HealthData.applyFilters(filters);
    displayData();
    updateStatistics();
    updateNearestFutureNotification();
    updateUpcomingEventsWarning();
    
    showToast('success', 'Bộ lọc', `Đã lọc được ${HealthData.filteredData().length} bản ghi`);
}

function resetFilters() {
    document.getElementById('filterName').value = "";
    document.getElementById('filterSeason').value = "";
    document.getElementById('filterSymptom').value = "";
    document.getElementById('filterStatus').value = "";
    document.getElementById('startDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('endDate').value = new Date().toISOString().split('T')[0];
    
    // Reset bộ lọc nâng cao
    document.getElementById('advFilterDaysFrom').value = "";
    document.getElementById('advFilterDaysTo').value = "";
    document.getElementById('advFilterSequenceFrom').value = "";
    document.getElementById('advFilterSequenceTo').value = "";
    document.getElementById('advFilterTimeFrom').value = "";
    document.getElementById('advFilterTimeTo').value = "";
    document.getElementById('advFilterSymptomContains').value = "";
    document.getElementById('advFilterNameContains').value = "";
    
    // Reset dữ liệu
    HealthData.filteredData = [...HealthData.healthData()];
    HealthData.currentPage = 1;
    HealthData.selectedRows.clear();
    HealthData.calculatePagination();
    
    // Cập nhật giao diện
    displayData();
    updateStatistics();
    updateNearestFutureNotification();
    updateUpcomingEventsWarning();
    
    showToast('info', 'Đặt lại bộ lọc', 'Đã đặt lại tất cả bộ lọc');
}

// ====================== BỘ LỌC NÂNG CAO ======================
function showAdvancedFilterModal() {
    document.getElementById('advancedFilterModal').style.display = 'flex';
}

function closeAdvancedFilterModal() {
    document.getElementById('advancedFilterModal').style.display = 'none';
}

function applyAdvancedFilters() {
    const filters = {
        daysFrom: parseInt(document.getElementById('advFilterDaysFrom').value) || 0,
        daysTo: parseInt(document.getElementById('advFilterDaysTo').value) || 365,
        sequenceFrom: parseInt(document.getElementById('advFilterSequenceFrom').value) || 0,
        sequenceTo: parseInt(document.getElementById('advFilterSequenceTo').value) || 1440,
        timeFrom: document.getElementById('advFilterTimeFrom').value,
        timeTo: document.getElementById('advFilterTimeTo').value,
        symptomContains: document.getElementById('advFilterSymptomContains').value.toLowerCase(),
        nameContains: document.getElementById('advFilterNameContains').value.toLowerCase()
    };
    
    const now = new Date();
    
    const filtered = HealthData.healthData().filter(item => {
        // Lọc theo số ngày còn lại
        const futureDate = HealthData.calculateFutureDate(item.eventDate, item.sequence);
        const futureTime = HealthData.calculateFutureTime(item.time, item.sequence);
        const futureDateTime = HealthData.getFutureDateTime(futureDate, futureTime);
        const remainingDays = HealthData.calculateRemainingDays(now, futureDateTime);
        
        if (filters.daysFrom !== undefined && remainingDays < filters.daysFrom) return false;
        if (filters.daysTo !== undefined && remainingDays > filters.daysTo) return false;
        
        // Lọc theo số TT
        const sequence = parseInt(item.sequence) || 0;
        if (filters.sequenceFrom !== undefined && sequence < filters.sequenceFrom) return false;
        if (filters.sequenceTo !== undefined && sequence > filters.sequenceTo) return false;
        
        // Lọc theo giờ
        if (filters.timeFrom && item.time < filters.timeFrom) return false;
        if (filters.timeTo && item.time > filters.timeTo) return false;
        
        // Lọc theo triệu chứng chứa
        if (filters.symptomContains && (!item.symptom || !item.symptom.toLowerCase().includes(filters.symptomContains))) {
            return false;
        }
        
        // Lọc theo tên chứa
        if (filters.nameContains && (!item.name || !item.name.toLowerCase().includes(filters.nameContains))) {
            return false;
        }
        
        return true;
    });
    
    HealthData.filteredData = filtered;
    HealthData.currentPage = 1;
    HealthData.selectedRows.clear();
    HealthData.calculatePagination();
    
    // Cập nhật giao diện
    displayData();
    updateStatistics();
    updateNearestFutureNotification();
    updateUpcomingEventsWarning();
    closeAdvancedFilterModal();
    
    showToast('success', 'Bộ lọc nâng cao', `Đã lọc được ${filtered.length} bản ghi`);
}

// ====================== THỐNG KÊ VÀ THÔNG BÁO ======================
function updateStatistics() {
    const total = HealthData.filteredData().length;
    const uniqueNames = new Set(HealthData.filteredData().map(item => item.name).filter(Boolean)).size;
    const uniqueSymptoms = new Set(HealthData.filteredData().map(item => item.symptom).filter(s => s && s !== "#N/A")).size;
    
    const now = new Date();
    let upcoming = 0;
    let danger = 0;
    let uniqueSeasons = new Set(HealthData.filteredData().map(item => item.season).filter(Boolean)).size;
    
    HealthData.filteredData().forEach(item => {
        const futureDate = HealthData.calculateFutureDate(item.eventDate, item.sequence);
        const futureTime = HealthData.calculateFutureTime(item.time, item.sequence);
        const futureDateTime = HealthData.getFutureDateTime(futureDate, futureTime);
        const remainingDays = HealthData.calculateRemainingDays(now, futureDateTime);
        const status = HealthData.getStatus(remainingDays);
        
        if (status === 'danger') danger++;
        if (status === 'warning' || status === 'danger') upcoming++;
    });
    
    document.getElementById('totalRecords').textContent = total;
    document.getElementById('uniqueNames').textContent = uniqueNames;
    document.getElementById('totalSymptoms').textContent = uniqueSymptoms;
    document.getElementById('upcomingEvents').textContent = upcoming;
    document.getElementById('dangerEvents').textContent = danger;
    document.getElementById('uniqueSeasons').textContent = uniqueSeasons;
}

function updateNearestFutureNotification() {
    const now = new Date();
    let nearestItem = null;
    let minTimeDiff = Infinity;
    
    HealthData.filteredData().forEach(item => {
        const futureDate = HealthData.calculateFutureDate(item.eventDate, item.sequence);
        const futureTime = HealthData.calculateFutureTime(item.time, item.sequence);
        const futureDateTime = HealthData.getFutureDateTime(futureDate, futureTime);
        const timeDiff = futureDateTime.getTime() - now.getTime();
        
        if (timeDiff > 0 && timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            nearestItem = {
                ...item,
                futureDate: futureDate,
                futureTime: futureTime,
                futureDateTime: futureDateTime
            };
        }
    });
    
    if (nearestItem) {
        const remainingDays = HealthData.calculateRemainingDays(now, nearestItem.futureDateTime);
        const remainingHours = HealthData.calculateRemainingHours(now, nearestItem.futureDateTime);
        const status = HealthData.getStatus(remainingDays);
        const statusText = HealthData.getStatusText(status);
        
        document.getElementById('nearestFutureDate').textContent = nearestItem.futureDate;
        document.getElementById('nearestFutureTime').textContent = nearestItem.futureTime;
        document.getElementById('nearestRemainingDays').textContent = remainingDays;
        document.getElementById('nearestRemainingHours').textContent = remainingHours;
        document.getElementById('nearestName').textContent = nearestItem.name || "Không tên";
        document.getElementById('nearestSymptom').textContent = nearestItem.symptom || "Không có";
        document.getElementById('nearestStatus').textContent = statusText;
    } else {
        document.getElementById('nearestFutureDate').textContent = "-";
        document.getElementById('nearestFutureTime').textContent = "-";
        document.getElementById('nearestRemainingDays').textContent = "-";
        document.getElementById('nearestRemainingHours').textContent = "-";
        document.getElementById('nearestName').textContent = "-";
        document.getElementById('nearestSymptom').textContent = "-";
        document.getElementById('nearestStatus').textContent = "-";
    }
}

function updateUpcomingEventsWarning() {
    const now = new Date();
    const upcomingEvents = [];
    const dangerEvents = [];
    
    HealthData.filteredData().forEach(item => {
        const futureDate = HealthData.calculateFutureDate(item.eventDate, item.sequence);
        const futureTime = HealthData.calculateFutureTime(item.time, item.sequence);
        const futureDateTime = HealthData.getFutureDateTime(futureDate, futureTime);
        const remainingDays = HealthData.calculateRemainingDays(now, futureDateTime);
        const status = HealthData.getStatus(remainingDays);
        
        if (status === 'danger' || status === 'warning') {
            const event = {
                name: item.name || "Không tên",
                futureDate: futureDate,
                futureTime: futureTime,
                remainingDays: remainingDays,
                symptom: item.symptom || "Không có",
                status: status
            };
            
            if (status === 'danger') {
                dangerEvents.push(event);
            } else {
                upcomingEvents.push(event);
            }
        }
    });
    
    // Hiển thị cảnh báo nguy hiểm
    const dangerPanel = document.getElementById('dangerPanel');
    const dangerEventsList = document.getElementById('dangerEventsList');
    
    if (dangerEvents.length > 0) {
        dangerPanel.style.display = 'block';
        let html = '';
        
        dangerEvents.forEach(event => {
            html += `
                <div class="notification-item">
                    <div class="notification-label">
                        <strong>${event.name}</strong> - ${event.futureDate} ${event.futureTime}
                        <br><small>Triệu chứng: ${event.symptom}</small>
                    </div>
                    <div class="notification-value" style="color: #e74c3c;">
                        ${event.remainingDays === 0 ? 'HÔM NAY' : `Còn ${event.remainingDays} ngày`}
                    </div>
                </div>
            `;
        });
        
        dangerEventsList.innerHTML = html;
    } else {
        dangerPanel.style.display = 'none';
    }
    
    // Hiển thị cảnh báo sắp diễn ra
    const warningPanel = document.getElementById('warningPanel');
    const upcomingEventsList = document.getElementById('upcomingEventsList');
    
    if (upcomingEvents.length > 0) {
        warningPanel.style.display = 'block';
        let html = '';
        
        upcomingEvents.forEach(event => {
            html += `
                <div class="notification-item">
                    <div class="notification-label">
                        <strong>${event.name}</strong> - ${event.futureDate} ${event.futureTime}
                        <br><small>Triệu chứng: ${event.symptom}</small>
                    </div>
                    <div class="notification-value" style="color: #f39c12;">
                        Còn ${event.remainingDays} ngày
                    </div>
                </div>
            `;
        });
        
        upcomingEventsList.innerHTML = html;
    } else {
        warningPanel.style.display = 'none';
    }
}

function updateFooterInfo() {
    document.getElementById('footerTotalRecords').textContent = HealthData.healthData().length;
    
    const size = new Blob([JSON.stringify(HealthData.healthData())]).size;
    document.getElementById('storageSize').textContent = `${(size / 1024).toFixed(2)} KB`;
    
    const lastUpdated = localStorage.getItem('lastUpdated');
    if (lastUpdated) {
        document.getElementById('lastUpdated').textContent = new Date(lastUpdated).toLocaleString('vi-VN');
    }
}

// ====================== TIỆN ÍCH ======================
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

function copyTextToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('success', 'Đã copy', 'Đã sao chép vào clipboard');
    }).catch(err => {
        showToast('error', 'Lỗi', 'Không thể sao chép');
    });
}

function loadSettings() {
    const autoSave = localStorage.getItem('autoSave');
    const showNotifications = localStorage.getItem('showNotifications');
    const enableSound = localStorage.getItem('enableSound');
    
    if (autoSave !== null) {
        document.getElementById('autoSaveCheckbox').checked = autoSave === 'true';
    }
    
    if (showNotifications !== null) {
        document.getElementById('showNotificationsCheckbox').checked = showNotifications === 'true';
    }
    
    if (enableSound !== null) {
        document.getElementById('enableSoundCheckbox').checked = enableSound === 'true';
    }
}

// ====================== IMPORT/EXPORT ======================
function exportData(data, filename) {
    if (!data) {
        data = HealthData.healthData();
    }
    if (!filename) {
        filename = `vanhan_data_${new Date().toISOString().split('T')[0]}.json`;
    }
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('success', 'Xuất dữ liệu', `Đã xuất ${data.length} bản ghi ra file`);
}

function importData(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedData)) {
                throw new Error('Dữ liệu không hợp lệ');
            }
            
            if (confirm(`Nhập dữ liệu sẽ thêm ${importedData.length} bản ghi vào hệ thống. Tiếp tục?`)) {
                // Add imported data to existing data
                importedData.forEach(item => {
                    if (!item.id) {
                        item.id = Date.now() + Math.floor(Math.random() * 1000);
                    }
                    HealthData.healthData().push(item);
                });
                
                // Update everything
                HealthData.filteredData = [...HealthData.healthData()];
                HealthData.currentPage = 1;
                HealthData.calculatePagination();
                HealthData.extractUniqueValues();
                HealthData.saveDataToStorage();
                
                displayData();
                updateStatistics();
                updateNearestFutureNotification();
                updateUpcomingEventsWarning();
                initFilterDropdowns();
                
                showToast('success', 'Nhập dữ liệu', `Đã nhập ${importedData.length} bản ghi thành công`);
            }
        } catch (error) {
            showToast('error', 'Lỗi nhập dữ liệu', 'File không hợp lệ hoặc đã bị hỏng');
            console.error('Import error:', error);
        }
    };
    
    reader.onerror = function() {
        showToast('error', 'Lỗi', 'Không thể đọc file');
    };
    
    reader.readAsText(file);
}

// ====================== HÀM TOÀN CỤC CHO HTML ======================
window.toggleRowSelection = toggleRowSelection;
window.editCell = editCell;
window.saveEdit = saveEdit;
window.editRecord = editRecord;
window.deleteRow = deleteRow;
window.viewDetails = viewDetails;
window.copyTextToClipboard = copyTextToClipboard;
window.copyTable = copyTable;
window.copyVisibleTable = copyVisibleTable;
window.copySelectedRows = copySelectedRows;
window.copyToClipboard = copyToClipboard;
window.initCopyFunctionality = initCopyFunctionality;
window.showToast = showToast;
window.goToPrevPage = goToPrevPage;
window.goToNextPage = goToNextPage;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.showAdvancedFilterModal = showAdvancedFilterModal;
window.closeAdvancedFilterModal = closeAdvancedFilterModal;
window.applyAdvancedFilters = applyAdvancedFilters;
window.exportSelectedRows = exportSelectedRows;
window.deleteSelectedRows = deleteSelectedRows;
window.exportData = exportData;
window.importData = importData;

// ====================== COPY FUNCTIONALITY ======================
function initCopyFunctionality() {
    // Copy từ nút copy trong input
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                copyToClipboard(targetElement.value || targetElement.textContent);
                showToast('success', 'Đã copy', 'Đã sao chép vào clipboard');
            }
        });
    });
    
    // Copy từ các ô copyable
    document.querySelectorAll('.copyable').forEach(element => {
        element.addEventListener('click', function() {
            copyToClipboard(this.textContent || this.value);
            showToast('success', 'Đã copy', 'Đã sao chép vào clipboard');
        });
    });
    
    // Copy all warning events
    document.getElementById('copyWarningEvents')?.addEventListener('click', function() {
        const warnings = document.getElementById('upcomingEventsList').textContent;
        copyToClipboard(warnings);
        showToast('success', 'Đã copy', 'Đã sao chép cảnh báo');
    });
    
    // Copy all danger events
    document.getElementById('copyDangerEvents')?.addEventListener('click', function() {
        const dangers = document.getElementById('dangerEventsList').textContent;
        copyToClipboard(dangers);
        showToast('success', 'Đã copy', 'Đã sao chép nguy hiểm');
    });
    
    // Copy notification
    document.getElementById('copyNotification')?.addEventListener('click', function() {
        const notification = document.querySelector('.notification-content').textContent;
        copyToClipboard(notification);
        showToast('success', 'Đã copy', 'Đã sao chép thông báo');
    });
    
    // Copy table buttons
    document.getElementById('copyTableBtn')?.addEventListener('click', copyTable);
    document.getElementById('copyVisibleTableBtn')?.addEventListener('click', copyVisibleTable);
    document.getElementById('copySelectedRowsBtn')?.addEventListener('click', copySelectedRows);
    document.getElementById('copySelectedBtn')?.addEventListener('click', copySelectedRows);
    
    // Context menu
    initContextMenu();
}

function copyToClipboard(text) {
    if (!text) return;
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text.trim()).then(() => {
            console.log('Copied to clipboard');
        }).catch(err => {
            console.error('Clipboard API error:', err);
            fallbackCopyText(text);
        });
    } else {
        fallbackCopyText(text);
    }
}

function fallbackCopyText(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        console.log('Copied using fallback');
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showToast('error', 'Lỗi', 'Không thể sao chép');
    }
    
    document.body.removeChild(textArea);
}

function copyTable() {
    const table = document.getElementById('mainDataTable');
    const data = tableToText(table);
    copyToClipboard(data);
    showToast('success', 'Đã copy', 'Đã sao chép toàn bộ bảng');
}

function copyVisibleTable() {
    const table = document.getElementById('mainDataTable');
    const clonedTable = table.cloneNode(true);
    
    const visibleRows = clonedTable.querySelectorAll('tbody tr:not([style*="display: none"]):not(.hidden)');
    const tbody = clonedTable.querySelector('tbody');
    
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    
    visibleRows.forEach(row => {
        tbody.appendChild(row);
    });
    
    const data = tableToText(clonedTable);
    copyToClipboard(data);
    showToast('success', 'Đã copy', 'Đã sao chép bảng hiển thị');
}

function copySelectedRows() {
    const selectedRows = document.querySelectorAll('tbody tr.selected');
    if (selectedRows.length === 0) {
        showToast('warning', 'Cảnh báo', 'Vui lòng chọn ít nhất một dòng');
        return;
    }
    
    const table = document.getElementById('mainDataTable');
    const clonedTable = table.cloneNode(true);
    const tbody = clonedTable.querySelector('tbody');
    
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    
    selectedRows.forEach(row => {
        tbody.appendChild(row.cloneNode(true));
    });
    
    const data = tableToText(clonedTable);
    copyToClipboard(data);
    showToast('success', 'Đã copy', `Đã sao chép ${selectedRows.length} dòng`);
}

function tableToText(table) {
    let text = '';
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        const rowData = [];
        
        cells.forEach((cell, index) => {
            if (index === 0 || index === cells.length - 1) return;
            
            let cellText = cell.textContent.trim();
            cellText = cellText.replace(/\n/g, ' ');
            cellText = cellText.replace(/"/g, '""');
            if (cellText.includes(',') || cellText.includes('"')) {
                cellText = '"' + cellText + '"';
            }
            rowData.push(cellText);
        });
        
        text += rowData.join(',') + '\n';
    });
    
    return text;
}

function initContextMenu() {
    const contextMenu = document.getElementById('copyContextMenu');
    if (!contextMenu) return;
    
    let selectedCell = null;
    
    document.addEventListener('contextmenu', function(e) {
        const cell = e.target.closest('td, .copyable');
        if (cell) {
            e.preventDefault();
            selectedCell = cell;
            
            contextMenu.style.display = 'block';
            contextMenu.style.left = e.pageX + 'px';
            contextMenu.style.top = e.pageY + 'px';
            
            const rect = contextMenu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                contextMenu.style.left = (e.pageX - rect.width) + 'px';
            }
            if (rect.bottom > window.innerHeight) {
                contextMenu.style.top = (e.pageY - rect.height) + 'px';
            }
        }
    });
    
    document.addEventListener('click', function() {
        contextMenu.style.display = 'none';
    });
    
    document.getElementById('copyCellText')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (selectedCell) {
            copyToClipboard(selectedCell.textContent);
            showToast('success', 'Đã copy', 'Đã sao chép ô');
        }
    });
    
    document.getElementById('copyRowData')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (selectedCell) {
            const row = selectedCell.closest('tr');
            const cells = row.querySelectorAll('td');
            const rowData = Array.from(cells).map(cell => cell.textContent.trim()).join('\t');
            copyToClipboard(rowData);
            showToast('success', 'Đã copy', 'Đã sao chép dòng');
        }
    });
    
    document.getElementById('copyColumnData')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (selectedCell) {
            const cellIndex = Array.from(selectedCell.parentNode.children).indexOf(selectedCell);
            const rows = document.querySelectorAll('#mainDataTable tbody tr');
            const columnData = [];
            
            rows.forEach(row => {
                const cell = row.children[cellIndex];
                if (cell) columnData.push(cell.textContent.trim());
            });
            
            copyToClipboard(columnData.join('\n'));
            showToast('success', 'Đã copy', 'Đã sao chép cột');
        }
    });
    
    document.getElementById('copyAsCSV')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (selectedCell) {
            const row = selectedCell.closest('tr');
            const cells = row.querySelectorAll('td');
            const rowData = Array.from(cells).map(cell => {
                let text = cell.textContent.trim();
                text = text.replace(/"/g, '""');
                return '"' + text + '"';
            }).join(',');
            
            copyToClipboard(rowData);
            showToast('success', 'Đã copy', 'Đã sao chép dưới dạng CSV');
        }
    });
    
    document.getElementById('copyAsJSON')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (selectedCell) {
            const row = selectedCell.closest('tr');
            const headers = Array.from(document.querySelectorAll('#mainDataTable th')).map(th => th.textContent.trim());
            const cells = row.querySelectorAll('td');
            const rowData = {};
            
            cells.forEach((cell, index) => {
                if (index < headers.length) {
                    rowData[headers[index]] = cell.textContent.trim();
                }
            });
            
            copyToClipboard(JSON.stringify(rowData, null, 2));
            showToast('success', 'Đã copy', 'Đã sao chép dưới dạng JSON');
        }
    });
}