"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput, DateClickArg, EventClickArg } from "@fullcalendar/core";
import { useEffect, useState } from "react";

export default function CalendarView(props: {
  events: EventInput[];
  onDateClick?: (arg: DateClickArg) => void;
  onEventClick?: (arg: EventClickArg) => void;
}) {
  const { events, onDateClick, onEventClick } = props;
  const [isNarrow, setIsNarrow] = useState(false);
  const [slotRange, setSlotRange] = useState({
    min: "08:00:00",
    max: "20:00:00",
  });

  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 720);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!events.length) {
      setSlotRange({ min: "08:00:00", max: "20:00:00" });
      return;
    }
    let earliest = 8;
    let latest = 20;
    for (const event of events) {
      const start =
        typeof event.start === "string"
          ? new Date(event.start)
          : event.start ?? null;
      const end =
        typeof event.end === "string" ? new Date(event.end) : event.end ?? null;
      if (start) {
        earliest = Math.min(earliest, start.getHours());
      }
      if (end) {
        latest = Math.max(latest, end.getHours() + (end.getMinutes() > 0 ? 1 : 0));
      }
    }
    earliest = Math.max(0, earliest - 1);
    latest = Math.min(24, Math.max(earliest + 1, latest + 1));
    const toTime = (h: number) => `${String(h).padStart(2, "0")}:00:00`;
    setSlotRange({ min: toTime(earliest), max: toTime(latest) });
  }, [events]);

  return (
    <div className="fc-responsive">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        height="auto"
        events={events}
        nowIndicator
        headerToolbar={
          isNarrow
            ? {
                left: "prev,next",
                center: "title",
                right: "today timeGridWeek,timeGridDay,dayGridMonth",
              }
            : {
                left: "prev,next today",
                center: "title",
                right: "timeGridWeek,timeGridDay,dayGridMonth",
              }
        }
        views={{
          timeGridWeek: { buttonText: isNarrow ? "W" : "Week" },
          timeGridDay: { buttonText: isNarrow ? "D" : "Day" },
          dayGridMonth: { buttonText: isNarrow ? "M" : "Month" },
        }}
        slotMinTime={slotRange.min}
        slotMaxTime={slotRange.max}
      slotDuration="00:30:00"
      expandRows
      allDaySlot={false}
      dayHeaderFormat={{ weekday: "short", day: "numeric" }}
      dateClick={onDateClick}
      eventClick={onEventClick}
      />
    </div>
  );
}
