"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput } from "@fullcalendar/core";
import { useEffect, useState } from "react";

export default function CalendarView(props: {
  events: EventInput[];
  onDateClick?: (arg: unknown) => void;
  onEventClick?: (arg: unknown) => void;
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
    const toDate = (value: unknown) => {
      if (value instanceof Date) return value;
      if (typeof value === "string" || typeof value === "number") {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
      if (Array.isArray(value) && value.length) {
        const parsed = new Date(value[0] as unknown as string);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
      return null;
    };
    let earliest = 8;
    let latest = 20;
    for (const event of events) {
      const start = toDate(event.start);
      const end = toDate(event.end);
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
        eventMinHeight={72}
        eventShortHeight={72}
        headerToolbar={
          isNarrow
            ? {
                left: "prev,next title today timeGridWeek,timeGridDay,dayGridMonth",
                center: "",
                right: "",
              }
            : {
                left: "prev,next today",
                center: "title",
                right: "timeGridWeek,timeGridDay,dayGridMonth",
              }
        }
        views={{
          timeGridWeek: {
            buttonText: isNarrow ? "W" : "Week",
            titleFormat: isNarrow
              ? { month: "short", day: "numeric" }
              : undefined,
          },
          timeGridDay: {
            buttonText: isNarrow ? "D" : "Day",
            titleFormat: { month: "short", day: "numeric", year: "numeric" },
          },
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
      eventContent={(arg) => {
        const location = (arg.event.extendedProps as { location?: string })?.location;
        return (
          <div className="fc-event-content-custom">
            <div className="fc-event-title">{arg.event.title}</div>
            {arg.timeText ? <div className="fc-event-time">{arg.timeText}</div> : null}
            {location ? <div className="fc-event-location">{location}</div> : null}
          </div>
        );
      }}
      />
    </div>
  );
}
