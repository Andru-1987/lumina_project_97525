export const formatDate = (dateStr: string): string => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'long', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('es-ES', options);
};

export const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export const generateTimeSlots = (startStr: string, endStr: string): string[] => {
  const slots: string[] = [];
  let [startH] = startStr.split(':').map(Number);
  const [endH] = endStr.split(':').map(Number);

  while (startH < endH) {
    slots.push(`${startH.toString().padStart(2, '0')}:00`);
    startH++;
  }
  return slots;
};

export const isDateBeforeToday = (dateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
};

export const getFutureDate = (daysToAdd: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
};

export const addDays = (dateStr: string, days: number): string => {
    const result = new Date(dateStr);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
};

export const parseCSV = (content: string): any[] => {
    const lines = content.split('\n');
    const result = [];
    // Simple parser assuming No Header or Header Name,Unit,Email
    for(let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if(!line) continue;
        const [name, unit, email] = line.split(',').map(s => s.trim());
        if(email && email.includes('@')) {
            result.push({ name, unit, email });
        }
    }
    return result;
};