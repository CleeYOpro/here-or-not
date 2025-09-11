import { useEffect } from "react";
import FullCalendar from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";

export default function Calendar({ events = [] }: { events?: { [key: string]: unknown }[] }) {
  useEffect(() => {
    const calendarEl = document.getElementById("calendar-container");
    if (calendarEl) {
      // FullCalendar is imported as default, but we need the Calendar constructor
      const CalendarConstructor = FullCalendar.Calendar as unknown as new (el: HTMLElement, options: object) => { render: () => void };
      const calendar = new CalendarConstructor(calendarEl, {
        plugins: [dayGridPlugin],
        initialView: "dayGridMonth",
        events,
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay"
        },
        themeSystem: "standard"
      });
      calendar.render();
    }
  }, [events]);

  return (
    <div className="rounded-xl bg-[#1E1E1E] p-6 shadow-lg border border-[#2D2D2D]">
      <div id="calendar-container" className="text-[#F1F1F1]" />
    </div>
  );
}