// data.js - chỉ chạy trong trình duyệt
(function() {
    // ====================== DỮ LIỆU MẪU ĐẦY ĐỦ ======================
    const sampleHealthData = [
        // ... (giữ nguyên dữ liệu mẫu của bạn) ...
    ];

    const solarTerms = [
        // ... (giữ nguyên dữ liệu tiết khí) ...
    ];

    // Lưu trữ biến toàn cục
    let healthData = null;
    let filteredData = null;
    let selectedRows = new Set();
    let currentPage = 1;
    let itemsPerPage = 25;
    let totalPages = 1;
    let allNames = null;
    let allSymptoms = null;
    let allSeasons = null;

    // ====================== HÀM QUẢN LÝ DỮ LIỆU ======================
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
        
        // Đảm bảo mỗi item có ID
        healthData.forEach((item, index) => {
            if (!item.id) {
                item.id = Date.now() + index;
            }
        });
        
        filteredData = [...healthData];
        extractUniqueValues();
        calculatePagination();
    }

    function extractUniqueValues() {
        allNames = new Set();
        allSymptoms = new Set();
        allSeasons = new Set();
        
        healthData.forEach(item => {
            if (item.name && item.name.trim() !== "") allNames.add(item.name);
            if (item.symptom && item.symptom.trim() !== "" && item.symptom !== "#N/A") {
                allSymptoms.add(item.symptom);
            }
            if (item.season && item.season.trim() !== "") allSeasons.add(item.season);
        });
    }

    function saveDataToStorage() {
        try {
            localStorage.setItem('healthData', JSON.stringify(healthData));
            localStorage.setItem('lastUpdated', new Date().toISOString());
            return true;
        } catch (e) {
            console.error('Lỗi khi lưu dữ liệu:', e);
            return false;
        }
    }

    // ====================== HÀM TÍNH TOÁN ======================
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
            return daysDiff;
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
            return hoursDiff;
        } catch (e) {
            console.error('Error calculating remaining hours:', e);
            return "N/A";
        }
    }

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

    function getStatus(daysRemaining) {
        if (daysRemaining === "N/A") return "unknown";
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
            default: return 'Không xác định';
        }
    }

    function getStatusClass(status) {
        switch(status) {
            case 'danger': return 'danger';
            case 'warning': return 'warning';
            case 'safe': return 'safe';
            case 'passed': return 'passed';
            default: return '';
        }
    }

    // ====================== HÀM MỚI BỔ SUNG ======================
    function calculateDayOrderFromInput() {
        const dateInput = document.getElementById('inputEventDate');
        if (dateInput && dateInput.value) {
            const dayOrder = calculateDayOrder(dateInput.value);
            const outputElement = document.getElementById('outputDaySeq');
            if (outputElement) outputElement.value = dayOrder;
        }
        return true;
    }

    function calculateTimeOrderFromInput() {
        const timeInput = document.getElementById('inputTime');
        if (timeInput && timeInput.value) {
            const timeOrder = calculateTimeOrder(timeInput.value);
            const outputElement = document.getElementById('outputHourSeq');
            if (outputElement) outputElement.value = timeOrder;
        }
        return true;
    }

    function addNewRecord() {
        try {
            const newRecord = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                birthDate: document.getElementById('inputBirthDate').value || "",
                badDate: document.getElementById('inputBadDate').value || "",
                dayOrder: calculateDayOrder(document.getElementById('inputEventDate').value) || "",
                eventDate: document.getElementById('inputEventDate').value || "",
                lunarDate: document.getElementById('inputLunarDate').value || "",
                season: document.getElementById('inputSeason').value || "",
                timeOrder: calculateTimeOrder(document.getElementById('inputTime').value) || "",
                time: document.getElementById('inputTime').value || "",
                sequence: document.getElementById('inputSequence').value || "",
                name: document.getElementById('inputName').value || "",
                symptom: document.getElementById('inputSymptom').value || "",
                solarTerm: getSolarTermByDate(parseDate(document.getElementById('inputEventDate').value)) || "",
                eatEast: document.getElementById('inputEatEast').value || "",
                eatWest: document.getElementById('inputEatWest').value || "",
                eatNorthSouth: document.getElementById('inputEatNorthSouth').value || ""
            };
            
            // Validate required fields
            if (!newRecord.eventDate || !newRecord.name) {
                alert("Vui lòng nhập ít nhất Ngày Vận Hạn và Tên");
                return false;
            }
            
            // Tính toán các giá trị bổ sung
            newRecord.pastDate = calculatePastDate(newRecord.eventDate, newRecord.sequence);
            newRecord.pastTime = calculatePastTime(newRecord.time, newRecord.sequence);
            newRecord.futureDate = calculateFutureDate(newRecord.eventDate, newRecord.sequence);
            newRecord.futureTime = calculateFutureTime(newRecord.time, newRecord.sequence);
            
            const futureDateTime = getFutureDateTime(newRecord.futureDate, newRecord.futureTime);
            const currentDate = new Date();
            const daysRemaining = calculateRemainingDays(currentDate, futureDateTime);
            const hoursRemaining = calculateRemainingHours(currentDate, futureDateTime);
            
            newRecord.remainingDays = daysRemaining;
            newRecord.remainingHours = hoursRemaining;
            newRecord.status = getStatus(daysRemaining);
            
            // Thêm vào mảng dữ liệu
            healthData.unshift(newRecord);
            filteredData = [...healthData];
            
            // Cập nhật giá trị unique
            extractUniqueValues();
            
            // Lưu vào storage
            saveDataToStorage();
            
            return true;
        } catch (error) {
            console.error('Lỗi khi thêm bản ghi mới:', error);
            return false;
        }
    }

    function clearForm() {
        document.getElementById('inputBirthDate').value = "";
        document.getElementById('inputBadDate').value = "";
        document.getElementById('inputEventDate').value = "";
        document.getElementById('inputLunarDate').value = "";
        document.getElementById('inputSeason').value = "";
        document.getElementById('inputTime').value = "";
        document.getElementById('inputSequence').value = "";
        document.getElementById('inputName').value = "";
        document.getElementById('inputSymptom').value = "";
        document.getElementById('inputEatEast').value = "";
        document.getElementById('inputEatWest').value = "";
        document.getElementById('inputEatNorthSouth').value = "";
        document.getElementById('outputDaySeq').value = "";
        document.getElementById('outputHourSeq').value = "";
    }

    function applyFilters(filters = {}) {
        try {
            filteredData = healthData.filter(item => {
                // Lọc theo tên
                if (filters.name && filters.name.trim() !== "" && item.name !== filters.name) {
                    return false;
                }
                
                // Lọc theo mùa
                if (filters.season && filters.season.trim() !== "" && item.season !== filters.season) {
                    return false;
                }
                
                // Lọc theo triệu chứng
                if (filters.symptom && filters.symptom.trim() !== "" && item.symptom !== filters.symptom) {
                    return false;
                }
                
                // Lọc theo khoảng ngày
                if (filters.startDate || filters.endDate) {
                    const eventDate = parseDate(item.eventDate);
                    if (eventDate) {
                        if (filters.startDate && eventDate < parseDate(filters.startDate)) {
                            return false;
                        }
                        if (filters.endDate && eventDate > parseDate(filters.endDate)) {
                            return false;
                        }
                    }
                }
                
                // Lọc theo trạng thái
                if (filters.status) {
                    const currentDate = new Date();
                    const futureDateTime = getFutureDateTime(item.futureDate, item.futureTime);
                    const daysRemaining = calculateRemainingDays(currentDate, futureDateTime);
                    const itemStatus = getStatus(daysRemaining);
                    
                    switch(filters.status) {
                        case 'danger':
                            if (itemStatus !== 'danger') return false;
                            break;
                        case 'warning':
                            if (itemStatus !== 'warning') return false;
                            break;
                        case 'upcoming':
                            if (itemStatus !== 'danger' && itemStatus !== 'warning') return false;
                            break;
                        case 'passed':
                            if (itemStatus !== 'passed') return false;
                            break;
                        case 'future':
                            if (itemStatus !== 'safe') return false;
                            break;
                    }
                }
                
                return true;
            });
            
            // Reset về trang 1 khi lọc
            currentPage = 1;
            calculatePagination();
            
            return filteredData.length;
        } catch (error) {
            console.error('Lỗi khi áp dụng bộ lọc:', error);
            filteredData = [...healthData];
            return filteredData.length;
        }
    }

    function calculatePagination() {
        totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;
    }

    function getPaginatedData() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredData.slice(startIndex, endIndex);
    }

    function updateCalculations() {
        healthData.forEach(item => {
            // Tính toán lại các giá trị phụ thuộc
            item.pastDate = calculatePastDate(item.eventDate, item.sequence);
            item.pastTime = calculatePastTime(item.time, item.sequence);
            item.futureDate = calculateFutureDate(item.eventDate, item.sequence);
            item.futureTime = calculateFutureTime(item.time, item.sequence);
            
            const futureDateTime = getFutureDateTime(item.futureDate, item.futureTime);
            const currentDate = new Date();
            item.remainingDays = calculateRemainingDays(currentDate, futureDateTime);
            item.remainingHours = calculateRemainingHours(currentDate, futureDateTime);
            item.status = getStatus(item.remainingDays);
            item.solarTerm = getSolarTermByDate(parseDate(item.eventDate));
        });
        
        saveDataToStorage();
        filteredData = [...healthData];
    }

    function copySelectedRows() {
        const selectedData = healthData.filter(item => selectedRows.has(item.id));
        return JSON.stringify(selectedData, null, 2);
    }

    function copyTableData() {
        return JSON.stringify(filteredData, null, 2);
    }

    function deleteSelectedRows() {
        healthData = healthData.filter(item => !selectedRows.has(item.id));
        selectedRows.clear();
        filteredData = [...healthData];
        saveDataToStorage();
    }

    // ====================== XUẤT RA WINDOW OBJECT ======================
    if (typeof window !== 'undefined') {
        window.HealthData = {
            // Biến
            healthData: () => healthData,
            filteredData: () => filteredData,
            selectedRows,
            currentPage,
            itemsPerPage,
            totalPages,
            allNames: () => allNames,
            allSymptoms: () => allSymptoms,
            allSeasons: () => allSeasons,
            
            // Hàm quản lý dữ liệu
            initializeData,
            extractUniqueValues,
            saveDataToStorage,
            
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
            
            // Hàm mới bổ sung
            calculateDayOrderFromInput,
            calculateTimeOrderFromInput,
            addNewRecord,
            clearForm,
            applyFilters,
            getPaginatedData,
            calculatePagination,
            updateCalculations,
            copySelectedRows,
            copyTableData,
            deleteSelectedRows,
            
            // Dữ liệu mẫu (chỉ đọc)
            getSampleData: () => [...sampleHealthData],
            getSolarTerms: () => [...solarTerms]
        };
        
        console.log('HealthData module đã được khởi tạo');
    } else {
        console.log('Không chạy trong môi trường trình duyệt');
    }
})();