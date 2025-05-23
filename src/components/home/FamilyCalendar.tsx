import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Import calendar default styles
import type { FamilyEvent } from '../../pages/EventsPage';
import type { FamilyMember } from '../../types';
import styles from './FamilyCalendar.module.css'; // Create this CSS module later

interface CalendarItem {
  date: Date;
  type: 'event' | 'birthday';
  title: string;
  id: string;
}

interface FamilyCalendarProps {
  events: FamilyEvent[];
  familyMembers: FamilyMember[];
}

const FamilyCalendar: React.FC<FamilyCalendarProps> = ({ events, familyMembers }) => {
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [value, setValue] = useState<Date | null>(new Date()); // State for calendar value, changed type to Date | null
  const [selectedDayItems, setSelectedDayItems] = useState<CalendarItem[]>([]); // New state for items on the selected day

  useEffect(() => {
    const items: CalendarItem[] = [];

    // Process events
    events.forEach(event => {
      items.push({
        id: `event-${event.id}`,
        date: event.date.toDate(),
        type: 'event',
        title: event.title,
      });
    });

    // Process birthdays
    familyMembers.forEach(member => {
      if (member.birthDate) {
        // For displaying birthdays on the calendar, we need to consider them annually.
        // This logic creates a CalendarItem for each birthday for the current year
        // and the next year to show upcoming birthdays.
        const birthDate = member.birthDate.toDate();
        const currentYear = new Date().getFullYear();

        // Create a date for the birthday in the current year, set to midnight UTC
        const birthDateThisYear = new Date(Date.UTC(currentYear, birthDate.getMonth(), birthDate.getDate()));
         items.push({
          id: `birthday-${member.id}-${currentYear}`,
          date: birthDateThisYear,
          type: 'birthday',
          title: `${member.name}'s Birthday`,
        });

        // Create a date for the birthday in the next year, set to midnight UTC
         const birthDateNextYear = new Date(Date.UTC(currentYear + 1, birthDate.getMonth(), birthDate.getDate()));
         items.push({
           id: `birthday-${member.id}-${currentYear + 1}`,
           date: birthDateNextYear,
           type: 'birthday',
           title: `${member.name}'s Birthday`,
         });
      }
    });

    // Sort items by date
    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    setCalendarItems(items);

    // Also filter items for the initially selected date (current date)
    const initialSelectedDate = value;
    if (initialSelectedDate) {
      const initialSelectedDateUTC = new Date(Date.UTC(initialSelectedDate.getFullYear(), initialSelectedDate.getMonth(), initialSelectedDate.getDate()));
      const itemsOnInitialSelectedDate = items.filter(item => {
        const itemDateUTC = new Date(Date.UTC(item.date.getFullYear(), item.date.getMonth(), item.date.getDate()));
        return itemDateUTC.getTime() === initialSelectedDateUTC.getTime();
      });
      setSelectedDayItems(itemsOnInitialSelectedDate);
    }

  }, [events, familyMembers, value]); // Add value to dependency array

  // Function to render content on calendar tiles
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      // Create a UTC date for comparison to avoid timezone issues
      const tileDateUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

      const itemsOnDate = calendarItems.filter(item => {
        // Compare dates based on UTC values
        const itemDateUTC = new Date(Date.UTC(item.date.getFullYear(), item.date.getMonth(), item.date.getDate()));
        return itemDateUTC.getTime() === tileDateUTC.getTime();
      });

      if (itemsOnDate.length > 0) {
        return (
          <div className={styles.tileContent}>
            {itemsOnDate.map(item => (
              <div key={item.id} className={`${styles.tileMarker} ${item.type === 'birthday' ? styles.birthdayMarker : styles.eventMarker}`} title={item.title}>
                {/* You can use a small dot, icon, or initial here */}
              </div>
            ))}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className={styles.familyCalendar}>
      <h3 className={styles.calendarTitle}>Family Calendar</h3>
      {calendarItems.length === 0 ? (
         <p className={styles.noItemsText}>Loading calendar data or no events/birthdays found.</p>
      ) : (
        <Calendar
          onChange={(newValue) => {
            const selectedDate = newValue as Date | null;
            setValue(selectedDate);
            // Filtering for selected day items is now handled in useEffect
          }}
          value={value}
          tileContent={tileContent}
          className={styles.reactCalendar} // Apply CSS module class
          tileClassName={({ date, view }) => {
            if (view === 'month' && date.getMonth() === (value as Date)?.getMonth()) {
              return styles.currentMonthDay;
            }
            return null;
          }}
        />
      )}

      {/* Section to display details for the selected day */}
      {selectedDayItems.length > 0 && (
        <div className={styles.selectedDayDetails}>
          <h4>Details for {value?.toLocaleDateString()}:</h4>
          <ul>
            {selectedDayItems.map(item => (
              <li key={item.id}>
                <strong>{item.type === 'birthday' ? 'Birthday:' : 'Event:'}</strong> {item.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FamilyCalendar;
