/**
 * ============================================
 * Student Attendance Management System
 * Google Apps Script Backend
 * ============================================
 * 
 * Deployment Instructions:
 * 1. Open https://script.google.com
 * 2. Create a new project
 * 3. Delete the default myFunction() code
 * 4. Paste ALL this code into Code.gs
 * 5. Save the project (Ctrl+S)
 * 6. Click "Deploy" > "New deployment"
 * 7. Select type: "Web app"
 * 8. Set execute as: "Me"
 * 9. Set access: "Anyone"
 * 10. Click "Deploy" and copy the Web App URL
 * 11. Paste that URL into your JavaScript CONFIG.API_URL
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  SHEET_ID: null, // Leave null to use active spreadsheet, or paste your Sheet ID here
  SHEETS: {
    ADMIN_USERS: 'AdminUsers',
    STUDENTS: 'Students',
    ATTENDANCE: 'Attendance',
    ACTIVITY_LOGS: 'ActivityLogs'
  }
};

// ============================================
// WEB APP ENTRY POINTS
// ============================================

/**
 * Handle GET requests
 * All API calls use GET with action parameter
 */
function doGet(e) {
  try {
    const action = e.parameter.action || '';
    
    switch (action) {
      case 'login':
        return handleLogin(e.parameter);
      case 'getStudents':
        return handleGetStudents();
      case 'getAdmins':
        return handleGetAdmins();
      case 'getAttendance':
        return handleGetAttendance(e.parameter);
      case 'getDashboardStats':
        return handleGetDashboardStats();
      case 'getActivityLogs':
        return handleGetActivityLogs(e.parameter);
      default:
        return jsonResponse({ success: false, message: 'Unknown action: ' + action });
    }
  } catch (error) {
    return jsonResponse({ success: false, message: error.toString() });
  }
}

/**
 * Handle POST requests for write operations
 */
function doPost(e) {
  try {
    // Parse form data or JSON
    let params = e.parameter;
    
    // Some requests might send JSON in postData
    if (e.postData && e.postData.contents) {
      try {
        const jsonData = JSON.parse(e.postData.contents);
        params = { ...params, ...jsonData };
      } catch (err) {
        // Not JSON, use form data
      }
    }
    
    const action = params.action || '';
    
    switch (action) {
      case 'login':
        return handleLogin(params);
      case 'addStudent':
        return handleAddStudent(params);
      case 'updateStudent':
        return handleUpdateStudent(params);
      case 'deleteStudent':
        return handleDeleteStudent(params);
      case 'markAttendance':
        return handleMarkAttendance(params);
      case 'saveAttendance':
        return handleSaveAttendance(params);
      case 'addAdmin':
        return handleAddAdmin(params);
      case 'deleteAdmin':
        return handleDeleteAdmin(params);
      case 'changePassword':
        return handleChangePassword(params);
      case 'logActivity':
        return handleLogActivity(params);
      default:
        return jsonResponse({ success: false, message: 'Unknown POST action: ' + action });
    }
  } catch (error) {
    return jsonResponse({ success: false, message: error.toString() });
  }
}

// ============================================
// SPREADSHEET HELPERS
// ============================================

/**
 * Get or create spreadsheet
 */
function getSpreadsheet() {
  if (CONFIG.SHEET_ID) {
    return SpreadsheetApp.openById(CONFIG.SHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Get or create a sheet by name
 */
function getOrCreateSheet(sheetName, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4361ee');
      headerRange.setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  }
  
  return sheet;
}

/**
 * Get all data from a sheet (excluding header)
 */
function getSheetData(sheetName) {
  const sheet = getOrCreateSheet(sheetName);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  if (values.length <= 1) return [];
  
  const headers = values[0];
  const rows = [];
  
  for (let i = 1; i < values.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      const key = toCamelCase(headers[j].toString());
      row[key] = values[i][j];
    }
    rows.push(row);
  }
  
  return rows;
}

/**
 * Convert header name to camelCase key
 */
function toCamelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

/**
 * Generate a unique ID
 */
function generateId(prefix) {
  return prefix + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmssSSS');
}

/**
 * Get current timestamp string
 */
function getTimestamp() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Get current date string
 */
function getCurrentDate() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * Get current time string
 */
function getCurrentTime() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'hh:mm a');
}

// ============================================
// RESPONSE HELPER
// ============================================

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// AUTHENTICATION HANDLERS
// ============================================

function handleLogin(params) {
  const username = params.username || '';
  const password = params.password || '';
  
  if (!username || !password) {
    return jsonResponse({ success: false, message: 'Username and password are required' });
  }
  
  // Ensure AdminUsers sheet exists with proper headers
  const sheet = getOrCreateSheet(CONFIG.SHEETS.ADMIN_USERS, 
    ['ID', 'AdminName', 'Username', 'Password', 'Role', 'CreatedDate']);
  
  // Check if we have any admin data
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  // If sheet is empty (only headers or completely empty), add default admin
  if (values.length <= 1) {
    // Add default admin
    sheet.appendRow(['A001', 'Super Admin', 'admin', 'admin123', 'Super Admin', getTimestamp()]);
    sheet.appendRow(['A002', 'Demo Teacher', 'teacher', 'teacher123', 'Teacher', getTimestamp()]);
    sheet.appendRow(['A003', 'Demo Staff', 'staff', 'staff123', 'Staff', getTimestamp()]);
  }
  
  // Find user by username
  const allValues = sheet.getDataRange().getValues();
  const headers = allValues[0];
  
  for (let i = 1; i < allValues.length; i++) {
    const row = allValues[i];
    const rowUsername = row[2]; // Username column index
    const rowPassword = row[3]; // Password column index
    
    if (rowUsername === username && rowPassword === password) {
      const user = {
        id: row[0],
        adminName: row[1],
        username: row[2],
        role: row[4],
        createdDate: row[5]
      };
      
      return jsonResponse({
        success: true,
        message: 'Login successful',
        user: user
      });
    }
  }
  
  return jsonResponse({ success: false, message: 'Invalid username or password' });
}

// ============================================
// STUDENT HANDLERS
// ============================================

function handleGetStudents() {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.STUDENTS, 
    ['StudentID', 'Name', 'RollNumber', 'Course', 'Mobile', 'Email', 'Gender', 'Address', 'CreatedDate']);
  
  // Add sample data if empty
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    const sampleStudents = [
      ['S001', 'Rahul Sharma', 'CS2024001', 'Computer Science', '9876543210', 'rahul@example.com', 'Male', 'Delhi, India', getTimestamp()],
      ['S002', 'Priya Patel', 'CS2024002', 'Computer Science', '9876543211', 'priya@example.com', 'Female', 'Mumbai, India', getTimestamp()],
      ['S003', 'Amit Kumar', 'EL2024001', 'Electrical', '9876543212', 'amit@example.com', 'Male', 'Bangalore, India', getTimestamp()],
      ['S004', 'Sneha Gupta', 'MH2024001', 'Mechanical', '9876543213', 'sneha@example.com', 'Female', 'Pune, India', getTimestamp()],
      ['S005', 'Vikram Singh', 'CV2024001', 'Civil', '9876543214', 'vikram@example.com', 'Male', 'Chennai, India', getTimestamp()],
      ['S006', 'Anita Desai', 'EC2024001', 'Electronics', '9876543215', 'anita@example.com', 'Female', 'Hyderabad, India', getTimestamp()]
    ];
    sampleStudents.forEach(s => sheet.appendRow(s));
  }
  
  const students = getSheetData(CONFIG.SHEETS.STUDENTS);
  return jsonResponse({ success: true, students: students });
}

function handleAddStudent(params) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.STUDENTS,
    ['StudentID', 'Name', 'RollNumber', 'Course', 'Mobile', 'Email', 'Gender', 'Address', 'CreatedDate']);
  
  // Check for duplicate roll number
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][2] === params.rollNumber) {
      return jsonResponse({ success: false, message: 'Roll number already exists' });
    }
  }
  
  const studentId = generateId('S');
  sheet.appendRow([
    studentId,
    params.name,
    params.rollNumber,
    params.course,
    params.mobile,
    params.email,
    params.gender,
    params.address || '',
    getTimestamp()
  ]);
  
  return jsonResponse({ success: true, message: 'Student added successfully', studentId });
}

function handleUpdateStudent(params) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.STUDENTS,
    ['StudentID', 'Name', 'RollNumber', 'Course', 'Mobile', 'Email', 'Gender', 'Address', 'CreatedDate']);
  
  const values = sheet.getDataRange().getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === params.studentId) {
      // Check roll number uniqueness if changed
      if (values[i][2] !== params.rollNumber) {
        for (let j = 1; j < values.length; j++) {
          if (j !== i && values[j][2] === params.rollNumber) {
            return jsonResponse({ success: false, message: 'Roll number already exists' });
          }
        }
      }
      
      sheet.getRange(i + 1, 2).setValue(params.name);
      sheet.getRange(i + 1, 3).setValue(params.rollNumber);
      sheet.getRange(i + 1, 4).setValue(params.course);
      sheet.getRange(i + 1, 5).setValue(params.mobile);
      sheet.getRange(i + 1, 6).setValue(params.email);
      sheet.getRange(i + 1, 7).setValue(params.gender);
      sheet.getRange(i + 1, 8).setValue(params.address || '');
      
      return jsonResponse({ success: true, message: 'Student updated successfully' });
    }
  }
  
  return jsonResponse({ success: false, message: 'Student not found' });
}

function handleDeleteStudent(params) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.STUDENTS);
  const values = sheet.getDataRange().getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === params.studentId) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ success: true, message: 'Student deleted successfully' });
    }
  }
  
  return jsonResponse({ success: false, message: 'Student not found' });
}

// ============================================
// ATTENDANCE HANDLERS
// ============================================

function handleGetAttendance(params) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.ATTENDANCE,
    ['AttendanceID', 'StudentID', 'Name', 'RollNumber', 'Course', 'Status', 'Date', 'Time', 'MarkedBy']);
  
  let attendance = getSheetData(CONFIG.SHEETS.ATTENDANCE);
  
  // Filter by date if provided
  if (params.date) {
    attendance = attendance.filter(a => a.date === params.date);
  }
  
  // Filter by course if provided
  if (params.course) {
    attendance = attendance.filter(a => a.course === params.course);
  }
  
  return jsonResponse({ success: true, attendance: attendance });
}

function handleMarkAttendance(params) {
  return handleSaveAttendance(params);
}

function handleSaveAttendance(params) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.ATTENDANCE,
    ['AttendanceID', 'StudentID', 'Name', 'RollNumber', 'Course', 'Status', 'Date', 'Time', 'MarkedBy']);
  
  let records = [];
  
  // Check if records is provided as JSON string (bulk save)
  if (params.records) {
    try {
      records = JSON.parse(params.records);
    } catch (e) {
      // Single record
      records = [{
        studentId: params.studentId,
        name: params.name,
        rollNumber: params.rollNumber,
        course: params.course,
        status: params.status,
        date: params.date,
        time: params.time,
        markedBy: params.markedBy
      }];
    }
  } else {
    records = [{
      studentId: params.studentId,
      name: params.name,
      rollNumber: params.rollNumber,
      course: params.course,
      status: params.status,
      date: params.date,
      time: params.time,
      markedBy: params.markedBy
    }];
  }
  
  // Process each record
  const allValues = sheet.getDataRange().getValues();
  
  for (const record of records) {
    let updated = false;
    
    // Check if attendance already exists for this student on this date
    for (let i = 1; i < allValues.length; i++) {
      if (allValues[i][1] === record.studentId && allValues[i][6] === record.date) {
        // Update existing
        sheet.getRange(i + 1, 5).setValue(record.status);
        sheet.getRange(i + 1, 8).setValue(record.time || getCurrentTime());
        updated = true;
        break;
      }
    }
    
    if (!updated) {
      // Add new
      sheet.appendRow([
        generateId('AT'),
        record.studentId,
        record.name,
        record.rollNumber,
        record.course,
        record.status,
        record.date,
        record.time || getCurrentTime(),
        record.markedBy || 'admin'
      ]);
    }
  }
  
  return jsonResponse({ success: true, message: `Attendance saved for ${records.length} student(s)` });
}

// ============================================
// ADMIN HANDLERS
// ============================================

function handleGetAdmins() {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.ADMIN_USERS,
    ['ID', 'AdminName', 'Username', 'Password', 'Role', 'CreatedDate']);
  
  const admins = getSheetData(CONFIG.SHEETS.ADMIN_USERS);
  
  // Remove password from response
  const safeAdmins = admins.map(a => ({
    id: a.id,
    adminName: a.adminName,
    username: a.username,
    role: a.role,
    createdDate: a.createdDate
  }));
  
  return jsonResponse({ success: true, admins: safeAdmins });
}

function handleAddAdmin(params) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.ADMIN_USERS,
    ['ID', 'AdminName', 'Username', 'Password', 'Role', 'CreatedDate']);
  
  // Check for duplicate username
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][2] === params.username) {
      return jsonResponse({ success: false, message: 'Username already exists' });
    }
  }
  
  const adminId = generateId('A');
  sheet.appendRow([
    adminId,
    params.adminName,
    params.username,
    params.password,
    params.role,
    getTimestamp()
  ]);
  
  return jsonResponse({ success: true, message: 'Admin added successfully', adminId });
}

function handleDeleteAdmin(params) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.ADMIN_USERS);
  const values = sheet.getDataRange().getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === params.adminId) {
      // Don't allow deleting the last Super Admin
      if (values[i][4] === 'Super Admin') {
        let superAdminCount = 0;
        for (let j = 1; j < values.length; j++) {
          if (values[j][4] === 'Super Admin') superAdminCount++;
        }
        if (superAdminCount <= 1) {
          return jsonResponse({ success: false, message: 'Cannot delete the last Super Admin' });
        }
      }
      
      sheet.deleteRow(i + 1);
      return jsonResponse({ success: true, message: 'Admin deleted successfully' });
    }
  }
  
  return jsonResponse({ success: false, message: 'Admin not found' });
}

function handleChangePassword(params) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.ADMIN_USERS);
  const values = sheet.getDataRange().getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === params.adminId || values[i][2] === params.adminId) {
      // If currentPassword is provided, verify it
      if (params.currentPassword && values[i][3] !== params.currentPassword) {
        return jsonResponse({ success: false, message: 'Current password is incorrect' });
      }
      
      sheet.getRange(i + 1, 4).setValue(params.newPassword);
      return jsonResponse({ success: true, message: 'Password changed successfully' });
    }
  }
  
  return jsonResponse({ success: false, message: 'Admin not found' });
}

// ============================================
// DASHBOARD STATS
// ============================================

function handleGetDashboardStats() {
  const studentsSheet = getOrCreateSheet(CONFIG.SHEETS.STUDENTS,
    ['StudentID', 'Name', 'RollNumber', 'Course', 'Mobile', 'Email', 'Gender', 'Address', 'CreatedDate']);
  
  const attendanceSheet = getOrCreateSheet(CONFIG.SHEETS.ATTENDANCE,
    ['AttendanceID', 'StudentID', 'Name', 'RollNumber', 'Course', 'Status', 'Date', 'Time', 'MarkedBy']);
  
  const adminSheet = getOrCreateSheet(CONFIG.SHEETS.ADMIN_USERS,
    ['ID', 'AdminName', 'Username', 'Password', 'Role', 'CreatedDate']);
  
  const totalStudents = Math.max(0, studentsSheet.getLastRow() - 1);
  const totalAdmins = Math.max(0, adminSheet.getLastRow() - 1);
  
  // Get today's attendance
  const today = getCurrentDate();
  const attendanceValues = attendanceSheet.getDataRange().getValues();
  let presentToday = 0;
  let absentToday = 0;
  let lateToday = 0;
  
  for (let i = 1; i < attendanceValues.length; i++) {
    if (attendanceValues[i][6] === today) {
      const status = attendanceValues[i][5];
      if (status === 'Present') presentToday++;
      else if (status === 'Absent') absentToday++;
      else if (status === 'Late') lateToday++;
    }
  }
  
  return jsonResponse({
    success: true,
    stats: {
      totalStudents: totalStudents,
      presentToday: presentToday,
      absentToday: absentToday,
      lateToday: lateToday,
      totalAdmins: totalAdmins
    }
  });
}

// ============================================
// ACTIVITY LOGS
// ============================================

function handleGetActivityLogs(params) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.ACTIVITY_LOGS,
    ['LogID', 'User', 'Activity', 'DateTime']);
  
  let logs = getSheetData(CONFIG.SHEETS.ACTIVITY_LOGS);
  
  // Sort by datetime descending
  logs.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  
  // Limit if specified
  const limit = parseInt(params.limit) || 50;
  logs = logs.slice(0, limit);
  
  return jsonResponse({ success: true, logs: logs });
}

function handleLogActivity(params) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.ACTIVITY_LOGS,
    ['LogID', 'User', 'Activity', 'DateTime']);
  
  const logId = generateId('L');
  sheet.appendRow([
    logId,
    params.user || 'system',
    params.activity || 'Unknown activity',
    params.dateTime || getTimestamp()
  ]);
  
  return jsonResponse({ success: true, message: 'Activity logged' });
}

// ============================================
// SETUP FUNCTION (Run once to initialize)
// ============================================

function setupSpreadsheet() {
  // Create all sheets with proper headers
  const ss = getSpreadsheet();
  
  // AdminUsers
  const adminSheet = getOrCreateSheet(CONFIG.SHEETS.ADMIN_USERS,
    ['ID', 'AdminName', 'Username', 'Password', 'Role', 'CreatedDate']);
  
  // Add default admin if empty
  if (adminSheet.getLastRow() <= 1) {
    adminSheet.appendRow(['A001', 'Super Admin', 'admin', 'admin123', 'Super Admin', getTimestamp()]);
    adminSheet.appendRow(['A002', 'Demo Teacher', 'teacher', 'teacher123', 'Teacher', getTimestamp()]);
    adminSheet.appendRow(['A003', 'Demo Staff', 'staff', 'staff123', 'Staff', getTimestamp()]);
  }
  
  // Students
  getOrCreateSheet(CONFIG.SHEETS.STUDENTS,
    ['StudentID', 'Name', 'RollNumber', 'Course', 'Mobile', 'Email', 'Gender', 'Address', 'CreatedDate']);
  
  // Attendance
  getOrCreateSheet(CONFIG.SHEETS.ATTENDANCE,
    ['AttendanceID', 'StudentID', 'Name', 'RollNumber', 'Course', 'Status', 'Date', 'Time', 'MarkedBy']);
  
  // ActivityLogs
  getOrCreateSheet(CONFIG.SHEETS.ACTIVITY_LOGS,
    ['LogID', 'User', 'Activity', 'DateTime']);
  
  Logger.log('Spreadsheet setup complete!');
  Logger.log('Sheets created: AdminUsers, Students, Attendance, ActivityLogs');
  Logger.log('Default admin: username=admin, password=admin123');
  
  return 'Setup complete! Check the sheets in your spreadsheet.';
}

// ============================================
// TEST FUNCTION
// ============================================

function testAPI() {
  // Simulate a login request
  const result = handleLogin({ username: 'admin', password: 'admin123' });
  Logger.log('Login test: ' + result.getContent());
  
  // Simulate getting students
  const students = handleGetStudents();
  Logger.log('Students: ' + students.getContent().substring(0, 200));
  
  return 'Tests completed. Check logs.';
}