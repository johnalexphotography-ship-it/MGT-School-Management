export const translations = {
  mm: {
    // ===== App =====
    app_name: 'MGT-School-Management-System',
    app_version: 'v1.0.0',
    developed_by: 'Developed by',

    // ===== Menu Items =====
    dashboard: 'Dashboard',
    students: 'ကျောင်းသားများ',
    teachers: 'ဆရာ/ဆရာမ',
    classes: 'အတန်းများ',
    timetable: 'အချိန်ဇယား',
    attendance: 'တက်ရောက်မှု',
    exams: 'စာမေးပွဲ',
    report_cards: 'Report Card',
    fees: 'ကျောင်းလခ',
    library: 'စာအုပ်တိုက်',
    cards: 'ကျောင်းသား ကဒ်',
    proposals: 'အဆိုပြုချက်',
    announcements: 'အသိပေးစာ',
    reports: 'Report များ',
    users: 'User စီမံခန့်ခွဲမှု',
    leaves: 'ခွင့်တင်ခြင်း',
    transport: 'ကျောင်းကား',
    about: 'ကျောင်းအကြောင်း',
    settings: 'ဆက်တင်',
    logout: 'ထွက်ရန်',
    profile: 'ကိုယ်ရေးအချက်အလက်',

    // ===== Common Buttons =====
    save: 'သိမ်းရန်',
    cancel: 'ပယ်ဖျက်',
    edit: 'ပြင်ရန်',
    delete: 'ဖျက်ရန်',
    add: 'ထည့်ရန်',
    search: 'ရှာဖွေရန်',
    filter: 'Filter လုပ်ရန်',
    print: 'Print ထုတ်ရန်',
    download: 'Download',
    upload: 'တင်ရန်',
    close: 'ပိတ်',
    confirm: 'အတည်ပြု',
    yes: 'ဟုတ်ကဲ့',
    no: 'မဟုတ်ဘူး',
    loading: 'Loading...',
    no_data: 'အချက်အလက် မရှိပါ',
    actions: 'လုပ်ဆောင်ချက်',
    status: 'အခြေအနေ',
    active: 'Active',
    inactive: 'Inactive',
    total: 'စုစုပေါင်း',
    all: 'အားလုံး',

    // ===== Login Page =====
    login: 'Login ဝင်ရန်',
    login_loading: 'ဝင်နေသည်...',
    username: 'အသုံးပြုသူ အမည်',
    password: 'Password',
    school_management: 'ကျောင်းစီမံခန့်ခွဲမှုစနစ်',
    login_error: 'Login မအောင်မြင်ပါ',
    welcome: 'မင်္ဂလာပါ',

    // ===== Language =====
    language: 'ဘာသာစကား',
    myanmar: 'မြန်မာ',
    english: 'English',
  },

  en: {
    // ===== App =====
    app_name: 'MGT-School-Management-System',
    app_version: 'v1.0.0',
    developed_by: 'Developed by',

    // ===== Menu Items =====
    dashboard: 'Dashboard',
    students: 'Students',
    teachers: 'Teachers',
    classes: 'Classes',
    timetable: 'Timetable',
    attendance: 'Attendance',
    exams: 'Exams',
    report_cards: 'Report Cards',
    fees: 'Fees',
    library: 'Library',
    cards: 'Student Cards',
    proposals: 'Proposals',
    announcements: 'Announcements',
    reports: 'Reports',
    users: 'User Management',
    leaves: 'Leaves',
    transport: 'Transport',
    about: 'About Us',
    settings: 'Settings',
    logout: 'Logout',
    profile: 'Profile',

    // ===== Common Buttons =====
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    print: 'Print',
    download: 'Download',
    upload: 'Upload',
    close: 'Close',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    loading: 'Loading...',
    no_data: 'No data available',
    actions: 'Actions',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    total: 'Total',
    all: 'All',

    // ===== Login Page =====
    login: 'Login',
    login_loading: 'Logging in...',
    username: 'Username',
    password: 'Password',
    school_management: 'School Management System',
    login_error: 'Login failed',
    welcome: 'Welcome',

    // ===== Language =====
    language: 'Language',
    myanmar: 'မြန်မာ',
    english: 'English',
  },
};

export const useTranslation = (language) => {
  const t = (key) => {
    return translations[language]?.[key] || translations.mm[key] || key;
  };
  return { t };
};