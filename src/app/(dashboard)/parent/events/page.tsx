"use client";

import { useEffect, useState } from "react";

type Event = {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string | null;
  targetRoles: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export default function ParentEventsPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/events/parent");
      
      if (!res.ok) {
        throw new Error("Failed to fetch events");
      }
      
      const data = await res.json();
      setUpcomingEvents(data.upcoming);
      setPastEvents(data.past);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getTimeUntilEvent = (eventDate: string) => {
    const now = new Date();
    const event = new Date(eventDate);
    const diff = event.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days < 7) return `In ${days} days`;
    if (days < 30) return `In ${Math.floor(days / 7)} weeks`;
    return `In ${Math.floor(days / 30)} months`;
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lamaSky mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error loading events</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const displayedEvents = showPast ? pastEvents : upcomingEvents;

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Events</h1>
          <p className="text-gray-600 mt-1">
            Stay informed about upcoming school activities and events
          </p>
        </div>
      </div>

      {/* Toggle Tabs */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setShowPast(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !showPast
                ? "bg-lamaSky text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📅 Upcoming ({upcomingEvents.length})
          </button>
          <button
            onClick={() => setShowPast(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showPast
                ? "bg-gray-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🕒 Past Events ({pastEvents.length})
          </button>
        </div>
      </div>

      {/* Events List */}
      {displayedEvents.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-600 font-medium">
            {showPast ? "No past events" : "No upcoming events"}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {showPast 
              ? "Past events will appear here once they are completed" 
              : "Check back later for new events"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {displayedEvents.map((event) => {
            const eventDate = new Date(event.eventDate);
            const isPast = eventDate < new Date();

            return (
              <div
                key={event.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                  isPast ? "opacity-75" : ""
                }`}
              >
                <div className="bg-gradient-to-r from-lamaSky to-lamaSkyLight p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {event.title}
                      </h3>
                      {!isPast && (
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-white text-lamaSky">
                          {getTimeUntilEvent(event.eventDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 text-gray-700 mb-3">
                    <svg
                      className="w-5 h-5 text-lamaSky"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-semibold">
                      {eventDate.toLocaleDateString("en-GB", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-2 text-gray-600 mb-4">
                      <svg
                        className="w-5 h-5 text-lamaSky"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>{event.location}</span>
                    </div>
                  )}

                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>

                  {isPast && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Event Completed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
