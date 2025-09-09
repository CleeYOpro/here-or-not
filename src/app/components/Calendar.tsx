import { useEffect } from "react";
// @ts-ignore
import FullCalendar from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";

export default function Calendar({ events = [] }: { events?: any[] }) {
  useEffect(() => {
    const calendarEl = document.getElementById("calendar-container");
    if (calendarEl) {
      const calendar = new (FullCalendar as any).Calendar(calendarEl, {
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