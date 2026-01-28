// ====================== DỮ LIỆU MẪU ĐẦY ĐỦ ======================
// Dữ liệu mẫu với đầy đủ thông tin cho 1 năm ghi chép
const sampleHealthData = [
    {
        "id": 1,
        "name": "Nguyễn Văn A",
        "dob": "15/04/1985",
        "sequence": "5",
        "symptom": "Đau đầu",
        "eventDate": "10/03/2024",
        "eventTime": "14:30",
        "season": "Xuân",
        "notes": "Đau đầu kèm buồn nôn"
    },
    {
        "id": 2,
        "name": "Trần Thị B",
        "dob": "22/08/1990",
        "sequence": "3",
        "symptom": "Đau dạ dày",
        "eventDate": "25/06/2024",
        "eventTime": "08:15",
        "season": "Hạ",
        "notes": "Đau sau khi ăn"
    },
    {
        "id": 3,
        "name": "Lê Văn C",
        "dob": "05/12/1978",
        "sequence": "7",
        "symptom": "Cảm cúm",
        "eventDate": "15/01/2024",
        "eventTime": "20:45",
        "season": "Đông",
        "notes": "Sốt nhẹ, sổ mũi"
    },
    {
        "id": 4,
        "name": "Phạm Thị D",
        "dob": "30/09/1995",
        "sequence": "4",
        "symptom": "Dị ứng",
        "eventDate": "05/05/2024",
        "eventTime": "10:00",
        "season": "Xuân",
        "notes": "Nổi mẩn ngứa"
    },
    {
        "id": 5,
        "name": "Hoàng Văn E",
        "dob": "18/02/1982",
        "sequence": "6",
        "symptom": "Đau lưng",
        "eventDate": "20/09/2024",
        "eventTime": "16:20",
        "season": "Thu",
        "notes": "Đau sau khi làm việc nặng"
    }
];

// Dữ liệu tiết khí
const solarTerms = [
    { name: "Lập xuân", month: 2, day: 4 },
    { name: "Vũ thủy", month: 2, day: 19 },
    { name: "Kinh trập", month: 3, day: 6 },
    { name: "Xuân phân", month: 3, day: 21 },
    { name: "Thanh minh", month: 4, day: 5 },
    { name: "Cốc vũ", month: 4, day: 20 },
    { name: "Lập hạ", month: 5, day: 6 },
    { name: "Tiểu mãn", month: 5, day: 21 },
    { name: "Mang chủng", month: 6, day: 6 },
    { name: "Hạ chí", month: 6, day: 21 },
    { name: "Tiểu thử", month: 7, day: 7 },
    { name: "Đại thử", month: 7, day: 23 },
    { name: "Lập thu", month: 8, day: 8 },
    { name: "Xử thử", month: 8, day: 23 },
    { name: "Bạch lộ", month: 9, day: 8 },
    { name: "Thu phân", month: 9, day: 23 },
    { name: "Hàn lộ", month: 10, day: 8 },
    { name: "Sương giáng", month: 10, day: 23 },
    { name: "Lập đông", month: 11, day: 7 },
    { name: "Tiểu tuyết", month: 11, day: 22 },
    { name: "Đại tuyết", month: 12, day: 7 },
    { name: "Đông chí", month: 12, day: 22 },
    { name: "Tiểu hàn", month: 1, day: 6 },
    { name: "Đại hàn", month: 1, day: 20 }
];

// Lưu trữ biến toàn cục
let healthData = [];
let filteredData = [];
let selectedRows = new Set();
let currentPage = 1;
let itemsPerPage = 25;
let totalPages = 1;
let allNames = new Set();
let allSymptoms = new Set();
let allSeasons = new Set();

// Khởi tạo dữ liệu từ localStorage hoặc dùng mẫu
function initializeData() {
    const savedData = localStorage.getItem('healthData');
    if (savedData) {
        try {
            healthData = JSON.parse(savedData);
            console.log(`Đã tải ${healthData.length} bản ghi từ localStorage`);
        } catch (e) {
            console.error('Lỗi khi tải dữ liệu:', e);
            healthData = [...sampleHealthData];
            saveDataToStorage();
        }
    } else {
        healthData = [...sampleHealthData];
        saveDataToStorage();
    }
    
    // Thêm id nếu chưa có
    healthData.forEach((item, index) => {
        if (!item.id) {
            item.id = Date.now() + index;
        }
    });
    
    // Khởi tạo filteredData
    filteredData = [...healthData];
    
    // Trích xuất giá trị duy nhất
    extractUniqueValues();
}

// Trích xuất giá trị duy nhất
function extractUniqueValues() {
    allNames.clear();
    allSymptoms.clear();
    allSeasons.clear();
    
    healthData.forEach(item => {
        if (item.name && item.name.trim() !== "") allNames.add(item.name);
        if (item.symptom && item.symptom.trim() !== "" && item.symptom !== "#N/A") {
            allSymptoms.add(item.symptom);
        }
        if (item.season && item.season.trim() !== "") allSeasons.add(item.season);
    });
}

// Lưu dữ liệu vào localStorage
function saveDataToStorage() {
    try {
        localStorage.setItem('healthData', JSON.stringify(healthData));
        const size = new Blob([JSON.stringify(healthData)]).size;
        console.log(`Đã lưu ${healthData.length} bản ghi (${(size / 1024).toFixed(2)} KB)`);
        
        // Lưu timestamp
        localStorage.setItem('lastUpdated', new Date().toISOString());
        
        // Ghi log thay đổi
        addChangeLog('Cập nhật dữ liệu', `Đã lưu ${healthData.length} bản ghi`);
        
        return true;
    } catch (e) {
        console.error('Lỗi khi lưu dữ liệu:', e);
        return false;
    }
}

// Thêm log thay đổi
function addChangeLog(action, description) {
    const logs = JSON.parse(localStorage.getItem('changeLogs') || '[]');
    const logEntry = {
        timestamp: new Date().toISOString(),
        action: action,
        description: description
    };
    
    logs.unshift(logEntry);
    if (logs.length > 50) logs.length = 50;
    
    localStorage.setItem('changeLogs', JSON.stringify(logs));
}

// Xuất dữ liệu ra file
function exportData(data = null, filename = null) {
    const exportData = data || healthData;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `vanhan_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`Đã xuất ${exportData.length} bản ghi thành công!`);
    addChangeLog('Xuất dữ liệu', `Xuất ${exportData.length} bản ghi`);
    return exportData.length;
}

// Nhập dữ liệu từ file - chỉ trả về dữ liệu, không xử lý UI
function importDataFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    resolve(importedData);
                } else {
                    reject(new Error('File không đúng định dạng!'));
                }
            } catch (e) {
                reject(new Error('Không thể đọc file!'));
            }
        };
        reader.readAsText(file);
    });
}

// Hàm để thực sự nhập dữ liệu
function performImport(importedData) {
    // Sao lưu dữ liệu hiện tại
    const backupKey = `backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(healthData));
    
    // Cập nhật dữ liệu với id mới
    const newData = importedData.map((item, index) => ({
        ...item,
        id: item.id || Date.now() + index,
        sequence: Number(item.sequence) || 0
    }));
    
    healthData = [...newData];
    filteredData = [...healthData];
    
    // Trích xuất giá trị duy nhất
    extractUniqueValues();
    
    // Lưu dữ liệu
    saveDataToStorage();
    
    addChangeLog('Nhập dữ liệu', `Nhập ${importedData.length} bản ghi từ file`);
    return newData.length;
}

// Tính toán cơ bản
function calculateDayOrder(dateString) {
    if(!dateString || dateString.trim() === "") return "";
    try {
        const parts = dateString.split('/');
        if (parts.length !== 3) return "";
        const dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
        const baseDate = new Date(1900, 0, 1);
        const diff = Math.floor((dateObj - baseDate) / (1000 * 60 * 60 * 24)) + 2;
        return diff > 0 ? diff : "";
    } catch (e) {
        console.error('Error calculating day order:', e);
        return "";
    }
}

function calculateTimeOrder(timeStr) {
    if(!timeStr) return "";
    try {
        const [h, m] = timeStr.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return "";
        return (h * 60) + m;
    } catch (e) {
        console.error('Error calculating time order:', e);
        return "";
    }
}

// Parse và format ngày
function parseDate(dateString) {
    if (!dateString || dateString === "#N/A" || dateString.trim() === "") return null;
    try {
        const parts = dateString.split('/');
        if (parts.length !== 3) return null;
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
        return new Date(year, month, day);
    } catch (e) {
        console.error('Error parsing date:', e);
        return null;
    }
}

function formatDate(date) {
    if (!date || isNaN(date.getTime())) return "N/A";
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Tính toán nâng cao
function calculatePastDate(eventDate, sequence) {
    try {
        const date = parseDate(eventDate);
        if (!date || isNaN(date.getTime())) return "N/A";
        const sequenceNum = parseInt(sequence) || 0;
        date.setDate(date.getDate() - sequenceNum);
        return formatDate(date);
    } catch (e) {
        console.error('Error calculating past date:', e);
        return "N/A";
    }
}

function calculatePastTime(eventTime, sequence) {
    try {
        if (!eventTime) return "N/A";
        const [hours, minutes] = eventTime.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return "N/A";
        const sequenceNum = parseInt(sequence) || 0;
        
        let totalMinutes = (hours * 60 + minutes) - (2 * sequenceNum);
        
        while (totalMinutes < 0) {
            totalMinutes += 24 * 60;
        }
        
        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMinutes = totalMinutes % 60;
        
        return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    } catch (e) {
        console.error('Error calculating past time:', e);
        return "N/A";
    }
}

function calculateFutureDate(eventDate, sequence) {
    try {
        const date = parseDate(eventDate);
        if (!date || isNaN(date.getTime())) return "N/A";
        const sequenceNum = parseInt(sequence) || 0;
        
        // Tính modulo nếu cần
        const currentDate = new Date();
        const daysSinceEvent = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));
        
        if (daysSinceEvent > 0 && daysSinceEvent > sequenceNum) {
            const modulo = daysSinceEvent % sequenceNum;
            const daysToAdd = sequenceNum - modulo;
            date.setDate(currentDate.getDate() + daysToAdd);
        } else {
            date.setDate(date.getDate() + sequenceNum);
        }
        
        return formatDate(date);
    } catch (e) {
        console.error('Error calculating future date:', e);
        return "N/A";
    }
}

function calculateFutureTime(eventTime, sequence) {
    try {
        if (!eventTime) return "N/A";
        const [hours, minutes] = eventTime.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return "N/A";
        const sequenceNum = parseInt(sequence) || 0;
        
        let totalMinutes = (hours * 60 + minutes) + (2 * sequenceNum);
        
        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMinutes = totalMinutes % 60;
        
        return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    } catch (e) {
        console.error('Error calculating future time:', e);
        return "N/A";
    }
}

// Tính toán thời gian còn lại
function getFutureDateTime(futureDateStr, futureTimeStr) {
    try {
        if (futureDateStr === "N/A" || futureTimeStr === "N/A") return new Date(0);
        
        const [day, month, year] = futureDateStr.split('/').map(Number);
        const [hours, minutes] = futureTimeStr.split(':').map(Number);
        
        if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
            return new Date(0);
        }
        
        return new Date(year, month - 1, day, hours, minutes);
    } catch (e) {
        console.error('Error getting future date time:', e);
        return new Date(0);
    }
}

function calculateRemainingDays(currentDate, futureDate) {
    try {
        if (!futureDate || isNaN(futureDate.getTime()) || futureDate.getTime() === 0) return "N/A";
        const timeDiff = futureDate.getTime() - currentDate.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
        
        if (daysDiff < 0) {
            return Math.abs(daysDiff);
        } else {
            return daysDiff;
        }
    } catch (e) {
        console.error('Error calculating remaining days:', e);
        return "N/A";
    }
}

function calculateRemainingHours(currentDate, futureDate) {
    try {
        if (!futureDate || isNaN(futureDate.getTime()) || futureDate.getTime() === 0) return "N/A";
        const timeDiff = futureDate.getTime() - currentDate.getTime();
        const hoursDiff = Math.floor(timeDiff / (1000 * 3600));
        
        if (hoursDiff < 0) {
            return Math.abs(hoursDiff);
        } else {
            return hoursDiff;
        }
    } catch (e) {
        console.error('Error calculating remaining hours:', e);
        return "N/A";
    }
}

// Xác định tiết khí
function getSolarTermByDate(date) {
    if (!date || isNaN(date.getTime())) return "N/A";
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    let closestTerm = solarTerms[0];
    let minDiff = Infinity;
    
    for (const term of solarTerms) {
        const termDate = new Date(date.getFullYear(), term.month - 1, term.day);
        const diff = Math.abs(date - termDate);
        
        if (diff < minDiff) {
            minDiff = diff;
            closestTerm = term;
        }
    }
    
    return closestTerm.name;
}

// Xác định trạng thái
function getStatus(daysRemaining) {
    if (daysRemaining === "N/A") return 'unknown';
    if (daysRemaining < 0) return 'passed';
    if (daysRemaining <= 3) return 'danger';
    if (daysRemaining <= 7) return 'warning';
    return 'safe';
}

function getStatusText(status) {
    switch(status) {
        case 'danger': return 'Nguy hiểm';
        case 'warning': return 'Cảnh báo';
        case 'safe': return 'An toàn';
        case 'passed': return 'Đã qua';
        case 'unknown': return 'Không xác định';
        default: return 'Không xác định';
    }
}

function getStatusClass(status) {
    switch(status) {
        case 'danger': return 'danger';
        case 'warning': return 'warning';
        case 'safe': return 'safe';
        case 'passed': return 'passed';
        case 'unknown': return 'unknown';
        default: return '';
    }
}

// Xuất các biến và hàm để app.js sử dụng
window.dataModule = {
    // Dữ liệu (sử dụng getter để luôn lấy giá trị mới nhất)
    get healthData() { return healthData; },
    set healthData(value) { healthData = value; },
    get filteredData() { return filteredData; },
    set filteredData(value) { filteredData = value; },
    get selectedRows() { return selectedRows; },
    set selectedRows(value) { selectedRows = value; },
    get currentPage() { return currentPage; },
    set currentPage(value) { currentPage = value; },
    get itemsPerPage() { return itemsPerPage; },
    set itemsPerPage(value) { itemsPerPage = value; },
    get totalPages() { return totalPages; },
    set totalPages(value) { totalPages = value; },
    get allNames() { return allNames; },
    get allSymptoms() { return allSymptoms; },
    get allSeasons() { return allSeasons; },
    
    // Các hàm quản lý dữ liệu
    initializeData,
    extractUniqueValues,
    saveDataToStorage,
    addChangeLog,
    exportData,
    importDataFromFile,
    performImport,
    
    // Hàm tính toán
    calculateDayOrder,
    calculateTimeOrder,
    parseDate,
    formatDate,
    calculatePastDate,
    calculatePastTime,
    calculateFutureDate,
    calculateFutureTime,
    getFutureDateTime,
    calculateRemainingDays,
    calculateRemainingHours,
    getSolarTermByDate,
    getStatus,
    getStatusText,
    getStatusClass,
    
    // Dữ liệu mẫu
    sampleHealthData,
    solarTerms
};

// Khởi tạo dữ liệu ngay khi tải
initializeData();