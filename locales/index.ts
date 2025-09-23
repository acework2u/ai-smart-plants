export type SupportedLanguage = 'en' | 'th';

type TranslationTree = Record<string, any>;

export const translations: Record<SupportedLanguage, TranslationTree> = {
  en: {
    tabs: {
      home: 'Home',
      garden: 'My Garden',
      insights: 'Insights',
      settings: 'Settings',
    },
    home:{
      welcome: 'Smart Plant Care',
      subtitle: 'Here\'s what\'s happening in your garden today.',
    },
    gardens:{
      my_garden: 'My Garden',
      add_plant: 'Add Plant',
      empty_title: 'Your garden is looking a bit empty',
      empty_subtitle: 'Start adding plants to see them here.',
    },
    settings: {
      hero: {
        eyebrow: 'Your Profile',
        title: 'Personalise your plant care experience',
        subtitle: 'Adjust theme, language and notifications so the app feels natural to you.',
        status: 'Secure',
        joinedPrefix: 'Joined ',
        joinedUnknown: 'Not specified',
        noEmail: 'No email added yet',
        fallbackName: 'Plant enthusiast',
        actions: {
          preferences: 'Preferences',
          notifications: 'Notifications',
          data: 'Data & Backup',
        },
      },
      sections: {
        general: {
          title: 'General',
          description: 'Control the basics such as theme, language and haptics.',
          items: {
            theme: {
              title: 'Theme',
              subtitle: 'Switch between light, dark or follow system',
            },
            language: {
              title: 'Language',
              subtitle: 'Choose the language used in the app',
            },
            haptics: {
              title: 'Haptic feedback',
              subtitle: 'Vibrate slightly when interacting with buttons',
            },
          },
        },
        measurement: {
          title: 'Measurement Units',
          description: 'Show watering and fertilising units you are familiar with.',
          items: {
            water: {
              title: 'Water volume',
              subtitle: 'Unit for watering activities',
            },
            fertilizer: {
              title: 'Fertiliser weight',
              subtitle: 'Unit for fertiliser activities',
            },
            temperature: {
              title: 'Temperature',
              subtitle: 'Unit for temperature displays',
            },
          },
        },
        notifications: {
          title: 'Notifications',
          description: 'Decide how and when reminders reach you.',
          items: {
            master: {
              title: 'Enable notifications',
              subtitle: 'Receive reminders and AI tips',
            },
            quietHours: {
              title: 'Quiet hours',
              subtitlePrefix: 'Do not disturb ',
            },
            preferredTime: {
              title: 'Preferred time',
              subtitle: 'Select the time reminders are sent',
            },
            sound: {
              title: 'Notification sound',
              subtitle: 'Play a sound for new reminders',
            },
            vibration: {
              title: 'Notification vibration',
              subtitle: 'Vibrate for high priority notifications',
            },
          },
        },
        privacy: {
          title: 'AI & Privacy',
          description: 'Control what data powers your AI recommendations.',
          items: {
            personalised: {
              title: 'Personalised AI tips',
              subtitle: 'Receive advice tailored to your plant history',
            },
            analytics: {
              title: 'Usage analytics',
              subtitle: 'Share anonymised usage data to improve the app',
            },
            crash: {
              title: 'Crash reports',
              subtitle: 'Send logs automatically when something goes wrong',
            },
          },
        },
        data: {
          title: 'Data & Maintenance',
          description: 'Manage backups, resets and notification history.',
          items: {
            backup: {
              title: 'Export data',
              subtitle: 'Share your profile and statistics as JSON',
            },
            reset: {
              title: 'Reset preferences',
              subtitle: 'Restore default settings for this device',
            },
            clearNotifications: {
              title: 'Clear notifications',
              subtitle: 'Remove saved notifications from the list',
            },
          },
        },
      },
      options: {
        theme: {
          light: 'Light',
          dark: 'Dark',
          system: 'System',
        },
        language: {
          th: 'ไทย',
          en: 'English',
        },
        volume: {
          ml: 'Millilitres',
          litre: 'Litres',
        },
        weight: {
          g: 'Grams',
          kg: 'Kilograms',
        },
        temperature: {
          celsius: '°C',
          fahrenheit: '°F',
        },
        notificationTime: {
          morning: '08:00',
          midday: '12:00',
          evening: '18:00',
          custom: 'Custom',
        },
      },
      timePicker: {
        title: 'Select notification time',
        hour: 'Hour',
        minute: 'Minute',
        cancel: 'Cancel',
        confirm: 'Confirm',
        selectedTime: 'Selected time',
      },
    },
    greeting:{
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      night: 'Good night',
    },
    quickactions:{
      herostatus: {
        all_good: 'All good',
        attention: 'Needs attention',
        action_required: 'Action required',
        critical: 'Critical',
        critical_title: 'Help Urgently Needed!',
        critical_context:'Plant needs help',
        follow: 'Follow',
        take_care_of: 'Take care of',
        all:'ทั้งหมด',
        healthy:'แข็งแรง',
        warning:'เตือน',
        needs_watering:'ต้องการรดน้ำ',
      }
    }
  },
  th: {
    tabs: {
      home: 'หน้าแรก',
      garden: 'สวนของฉัน',
      insights: 'ข้อมูลเชิงลึก',
      settings: 'การตั้งค่า',
    },
    home:{
      welcome: 'Smart Plant Care',
      subtitle: 'Here\'s what\'s happening in your garden today.',
    },
    gardens:{
      my_garden: 'สวนของฉัน',
      add_plant: 'เพิ่มต้นไม้',
      empty_title: 'สวนของคุณดูว่างเปล่าเล็กน้อย',
      empty_subtitle: 'เริ่มเพิ่มต้นไม้เพื่อดูที่นี่ครับ',
    },
    settings: {
      hero: {
        eyebrow: 'โปรไฟล์ของคุณ',
        title: 'ปรับประสบการณ์การดูแลสวนของคุณ',
        subtitle: 'ตั้งค่าธีม ภาษา และการแจ้งเตือนให้เหมาะกับวิธีที่คุณดูแลต้นไม้',
        status: 'ปลอดภัย',
        joinedPrefix: 'เข้าร่วมเมื่อ ',
        joinedUnknown: 'ยังไม่ระบุ',
        noEmail: 'ยังไม่ได้ระบุอีเมล',
        fallbackName: 'นักปลูกต้นไม้',
        actions: {
          preferences: 'การตั้งค่า',
          notifications: 'การแจ้งเตือน',
          data: 'ข้อมูล & สำรอง',
        },
      },
      sections: {
        general: {
          title: 'ทั่วไป',
          description: 'ควบคุมการตั้งค่าหลัก เช่น ธีม ภาษา และการสั่นตอบสนอง',
          items: {
            theme: {
              title: 'ธีมแอป',
              subtitle: 'เลือกระหว่างสว่าง มืด หรืออิงตามระบบ',
            },
            language: {
              title: 'ภาษา',
              subtitle: 'เลือกภาษาที่ใช้ในแอปทั้งหมด',
            },
            haptics: {
              title: 'การสั่นตอบสนอง',
              subtitle: 'ให้แอปสั่นเบา ๆ เมื่อกดปุ่มหรือเลือกเมนู',
            },
          },
        },
        measurement: {
          title: 'หน่วยวัด',
          description: 'กำหนดหน่วยที่คุ้นเคยสำหรับการดูแลต้นไม้',
          items: {
            water: {
              title: 'ปริมาณน้ำ',
              subtitle: 'หน่วยสำหรับกิจกรรมการรดน้ำ',
            },
            fertilizer: {
              title: 'น้ำหนักปุ๋ย',
              subtitle: 'หน่วยสำหรับกิจกรรมการใส่ปุ๋ย',
            },
            temperature: {
              title: 'อุณหภูมิ',
              subtitle: 'หน่วยสำหรับการแสดงอุณหภูมิ',
            },
          },
        },
        notifications: {
          title: 'การแจ้งเตือน',
          description: 'กำหนดลักษณะและช่วงเวลาการแจ้งเตือน',
          items: {
            master: {
              title: 'เปิดใช้งานการแจ้งเตือน',
              subtitle: 'รับทั้งการเตือนและคำแนะนำจาก AI',
            },
            quietHours: {
              title: 'โหมดห้ามรบกวน',
              subtitlePrefix: 'งดแจ้งเตือน ',
            },
            preferredTime: {
              title: 'เวลาที่แจ้งเตือน',
              subtitle: 'เลือกช่วงเวลาที่คุณสะดวก',
            },
            sound: {
              title: 'เสียงแจ้งเตือน',
              subtitle: 'เปิดเสียงเมื่อมีการแจ้งเตือน',
            },
            vibration: {
              title: 'การสั่นแจ้งเตือน',
              subtitle: 'สั่นเมื่อมีการแจ้งเตือนสำคัญ',
            },
          },
        },
        privacy: {
          title: 'AI และความเป็นส่วนตัว',
          description: 'ควบคุมการใช้งานข้อมูลเพื่อปรับปรุงคำแนะนำ',
          items: {
            personalised: {
              title: 'คำแนะนำเฉพาะบุคคล',
              subtitle: 'รับคำแนะนำตามประวัติการดูแลของคุณ',
            },
            analytics: {
              title: 'ข้อมูลการใช้งาน',
              subtitle: 'แชร์ข้อมูลแบบไม่ระบุตัวตนเพื่อพัฒนาแอป',
            },
            crash: {
              title: 'รายงานข้อผิดพลาด',
              subtitle: 'ส่ง log อัตโนมัติเมื่อพบปัญหา',
            },
          },
        },
        data: {
          title: 'ข้อมูลและการบำรุงรักษา',
          description: 'จัดการการสำรองข้อมูล การรีเซ็ต และประวัติแจ้งเตือน',
          items: {
            backup: {
              title: 'สำรองข้อมูล',
              subtitle: 'ส่งออกข้อมูลโปรไฟล์และสถิติ',
            },
            reset: {
              title: 'รีเซ็ตการตั้งค่า',
              subtitle: 'คืนค่าการตั้งค่ามาตรฐานสำหรับอุปกรณ์นี้',
            },
            clearNotifications: {
              title: 'ล้างการแจ้งเตือน',
              subtitle: 'ลบประวัติการแจ้งเตือนทั้งหมด',
            },
          },
        },
      },
      options: {
        theme: {
          light: 'สว่าง',
          dark: 'มืด',
          system: 'ตามระบบ',
        },
        language: {
          th: 'ไทย',
          en: 'English',
        },
        volume: {
          ml: 'มิลลิลิตร',
          litre: 'ลิตร',
        },
        weight: {
          g: 'กรัม',
          kg: 'กิโลกรัม',
        },
        temperature: {
          celsius: '°C',
          fahrenheit: '°F',
        },
        notificationTime: {
          morning: '08:00',
          midday: '12:00',
          evening: '18:00',
          custom: 'กำหนดเอง',
        },
      },
      timePicker: {
        title: 'เลือกเวลาแจ้งเตือน',
        hour: 'ชั่วโมง',
        minute: 'นาที',
        cancel: 'ยกเลิก',
        confirm: 'ยืนยัน',
        selectedTime: 'เวลาที่เลือก',
      },
    },
    greeting:{
      morning: 'สวัสดีตอนเช้า',
      afternoon: 'สวัสดีตอนบ่าย',
      evening: 'สวัสดีตอนเย็น',
      night: 'ราตรีสวัสดิ์',
    },
    quickactions:{
      herostatus: {
        all_good: 'ทุกอย่างเรียบร้อย',
        attention: 'ต้องการความสนใจ',
        action_required: 'ต้องการการดำเนินการ',
        critical: 'วิกฤต',
        critical_title: 'ช่วยด่วน!',
        critical_context:'ต้นต้องการความช่วยเหลือ',
        follow: 'Follow',
        take_care_of: 'Take care of',
        all:'ทั้งหมด',
        healthy:'แข็งแรง',
        warning:'เตือน',
        needs_watering:'ต้องการรดน้ำ',
      }
    }
  },
};

export const fallbackLanguage: SupportedLanguage = 'en';
export const supportedLanguages: SupportedLanguage[] = ['en', 'th'];
