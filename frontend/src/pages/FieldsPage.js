import { useState } from "react";
import { api } from "../apiClient";
import {
  sportLabel,
  isEmpty,
  isValidDateInput,
  todayInputValue,
} from "../utils";

export default function FieldsPage({ user }) {
  // ================= FIELD SEARCH STATE =================

  // text typed in the field search
  const [query, setQuery] = useState("");

  // selected sport filter
  const [sport, setSport] = useState("");

  // list of fields loaded from the backend
  const [fields, setFields] = useState([]);

  // ================= SELECTED FIELD STATE =================

  // id of the selected field
  const [selectedId, setSelectedId] = useState("");

  // name of the selected field, shown in the readonly input
  const [selectedLabel, setSelectedLabel] = useState("");

  // ================= FIELD DETAILS STATE =================

  // id of the field whose details are currently shown
  const [openFieldDetails, setOpenFieldDetails] = useState(null);

  // full data of the selected field for the details view
  const [details, setDetails] = useState(null);

  // ================= SLOTS STATE =================

  // date chosen to see available slots
  const [slotsDate, setSlotsDate] = useState(todayInputValue());

  // slot data loaded from the backend
  const [slotsData, setSlotsData] = useState(null);

  // ================= MESSAGES STATE =================

  // error or success messages shown to the user
  const [message, setMessage] = useState("");

  // ================= UTILITY FUNCTIONS =================

  // Selects or deselects a field
  function selectField(id, name) {
    // If the already-selected field is clicked again, deselect it
    if (selectedId === id) {
      setSelectedId("");
      setSelectedLabel("");
      setSlotsData(null);
      setOpenFieldDetails(null);
      setDetails(null);
      setMessage("");
      return;
    }

    // Otherwise save the newly selected field
    setSelectedId(id);
    setSelectedLabel(name || "Field");
    setSlotsData(null);
    setMessage("");
  }

  // Checks whether a slot is already in the past relative to the current date/time
  function isPastSlot(date, slot) {
    const slotDateTime = new Date(`${date}T${slot}:00`);

    // If the date is invalid, do not consider it past for safety
    if (Number.isNaN(slotDateTime.getTime())) {
      return false;
    }

    return slotDateTime <= new Date();
  }

  // ================= API: FIELDS =================

  // Loads the field list using text search and sport filter
  async function loadFields() {
    try {
      const data = await api.getFields(query, sport);

      // The backend should return an array of fields
      setFields(Array.isArray(data) ? data : []);

      // if the selected field is no longer in the list, deselect it
      if (selectedId && !data.find(f => f._id === selectedId)) {
        setSelectedId("");
        setSelectedLabel("");
        setSlotsData(null);
        setOpenFieldDetails(null);
        setDetails(null);
      }

      setMessage("Fields loaded.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Shows or hides the details of a field
  async function toggleFieldDetails(field) {
    try {
      // If the details for this field are already open, close them
      if (openFieldDetails === field._id) {
        setOpenFieldDetails(null);
        return;
      }

      // Otherwise load the details from the backend
      const data = await api.getFieldById(field._id);

      setDetails(data);
      setOpenFieldDetails(field._id);
      setMessage("");
    } catch (err) {
      setMessage(err.message);
    }
  }

  // ================= API: SLOTS / BOOKINGS =================

  // Loads the available slots for the selected field on a given date
  async function loadSlots() {
    try {
      // First check that a field is selected and the date is valid
      if (isEmpty(selectedId) || !isValidDateInput(slotsDate)) {
        setMessage("Invalid field or date.");
        return;
      }

      const data = await api.getSlots(selectedId, slotsDate);

      setSlotsData(data);
      setMessage("Slots loaded.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Books a free slot
  async function bookFromSlot(slot) {
    try {
      // A login is required to book
      if (!user) {
        setMessage("You must be logged in to book.");
        return;
      }

      // Check minimum data before the API call
      if (isEmpty(selectedId) || isEmpty(slot) || !isValidDateInput(slotsDate)) {
        setMessage("Invalid data.");
        return;
      }

      await api.bookSlot(selectedId, {
        date: slotsDate,
        slot,
      });

      setMessage(`Booking confirmed for slot ${slot}.`);

      // After booking, reload the slots to update the UI
      const updated = await api.getSlots(selectedId, slotsDate);
      setSlotsData(updated);
    } catch (err) {
      setMessage(err.message);
    }
  }

  // Cancels an existing booking
  async function cancelFromSlot(bookingId) {
    try {
      // A login is required to cancel
      if (!user) {
        setMessage("You must be logged in to cancel a booking.");
        return;
      }

      // Check that field and booking are valid
      if (isEmpty(selectedId) || isEmpty(bookingId)) {
        setMessage("Invalid data.");
        return;
      }

      await api.cancelBooking(selectedId, bookingId);

      setMessage("Booking cancelled.");

      // After cancellation, reload the slots to update free/busy status
      const updated = await api.getSlots(selectedId, slotsDate);
      setSlotsData(updated);
    } catch (err) {
      setMessage(err.message);
    }
  }

  // ================= UI =================

  return (
    <section>
      {/* PAGE HEADER */}
      <div className="section-header">
        <h2>Fields</h2>
        <p>Search, details, availability and bookings</p>
      </div>

      {/* FEEDBACK MESSAGES */}
      {message && <div className="card mb-md">{message}</div>}

      {/* NOTICE FOR UNAUTHENTICATED USERS */}
      {!user && (
        <div className="card mb-md">
          You can view fields and availability. Log in to book or cancel.
        </div>
      )}

      {/* SEARCH + SLOTS SECTION */}
      <div className="cards-grid">
        {/* FIELD SEARCH CARD */}
        <div className="card">
          <h3>Search Fields</h3>

          <div className="form-group">
            {/* Search by field name */}
            <input
              className="form-input"
              placeholder="Field name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {/* Sport filter */}
            <select
              className="form-input"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
            >
              <option value="">All</option>
              <option value="football">Football</option>
              <option value="volleyball">Volleyball</option>
              <option value="basketball">Basketball</option>
            </select>

            {/* Start the search */}
            <button className="btn btn-primary" onClick={loadFields}>
              Search
            </button>
          </div>
        </div>

        {/* AVAILABLE SLOTS CARD */}
        <div className="card">
          <h3>Available Slots</h3>

          <div className="form-group">
            {/* Shows the selected field */}
            <input
              className="form-input"
              value={selectedLabel}
              readOnly
              placeholder="Selected field"
            />

            {/* Date to check slots for */}
            <input
              className="form-input"
              type="date"
              value={slotsDate}
              onChange={(e) => setSlotsDate(e.target.value)}
            />

            {/* Load slots for the selected field */}
            <button className="btn btn-primary" onClick={loadSlots}>
              Load Slots
            </button>
          </div>

          {/* LISTA SLOT */}
          {slotsData?.slots && (
            <div className="output-container">
              {slotsData.slots.map((slotData, index) => (
                <div
                  key={index}
                  className={`item ${slotData.available ? "free" : "busy"}`}
                >
                  <strong>{slotData.slot}</strong> —{" "}
                  {slotData.available ? "Free" : "Busy"}

                  {/* If the slot is free, it can be booked */}
                  {slotData.available && (
                    <div className="mt-xs">
                      {isPastSlot(slotsDate, slotData.slot) ? (
                        <button className="btn btn-secondary" disabled>
                          Expired
                        </button>
                      ) : (
                        <button
                          className="btn btn-success"
                          onClick={() => bookFromSlot(slotData.slot)}
                        >
                          Book
                        </button>
                      )}
                    </div>
                  )}

                  {/* If the slot is busy and I am logged in, I can try to cancel it */}
                  {!slotData.available && slotData.bookingId && user && slotData.bookingUserId === user.id && (
                    <div className="mt-xs">
                      <button
                        className="btn btn-danger"
                        onClick={() => cancelFromSlot(slotData.bookingId)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FIELD LIST */}
      <div className="list-container">
        {fields.map((field) => {
          // Check if this field is the currently selected one
          const isSelected = selectedId === field._id;

          return (
            <div
              key={field._id}
              className={`item ${isSelected ? "selected-outline" : ""}`}
            >
              <h4>{field.name}</h4>

              <p>
                <strong>Sport:</strong> {sportLabel(field.sport)}
              </p>

              <div className="small-actions">
                {/* Select/deselect the field to view slots */}
                <button onClick={() => selectField(field._id, field.name)}>
                  {isSelected ? "Deselect" : "Select"}
                </button>

                {/* Show/hide field details */}
                <button onClick={() => toggleFieldDetails(field)}>
                  {openFieldDetails === field._id
                    ? "Hide details"
                    : "Details"}
                </button>
              </div>

              {/* FIELD DETAILS */}
              {openFieldDetails === field._id && details && (
                <div className="output-container mt-sm">
                  <div className="item">
                    <p>
                      <strong>Name:</strong> {details.name}
                    </p>

                    <p>
                      <strong>Sport:</strong> {sportLabel(details.sport)}
                    </p>

                    <p>
                      <strong>Address:</strong> {details.address}
                    </p>

                    <p>
                      <strong>Slots:</strong>{" "}
                      {details.slots && details.slots.length > 0 ? details.slots.join(", ") : "-"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
