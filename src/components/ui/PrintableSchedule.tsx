import React from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  company: string;
}

interface ScheduleShift {
  id: string;
  userId: string;
  projectId?: string;
  startTime: string;
  endTime: string;
  role?: string;
  notes?: string;
  status: "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  user: User;
  project?: Project;
}

interface Schedule {
  id: string;
  date: string;
  title?: string;
  description?: string;
  shifts: ScheduleShift[];
}

interface PrintableScheduleProps {
  schedule: Schedule;
  selectedDate: string;
  companyName?: string;
}

const PrintableSchedule: React.FC<PrintableScheduleProps> = ({
  schedule,
  selectedDate,
  companyName = "JobFlow",
}) => {
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusText = (status: ScheduleShift["status"]) => {
    switch (status) {
      case "SCHEDULED":
        return "Ingepland";
      case "CONFIRMED":
        return "Bevestigd";
      case "CANCELLED":
        return "Geannuleerd";
      case "COMPLETED":
        return "Voltooid";
      default:
        return status;
    }
  };

  const calculateTotalHours = () => {
    return schedule.shifts.reduce((total, shift) => {
      const start = new Date(shift.startTime);
      const end = new Date(shift.endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
  };

  return (
    <div className="print:block hidden">
      <style jsx>{`
        @media print {
          @page {
            margin: 1in;
            size: A4;
          }

          .print-container {
            font-family: Arial, sans-serif;
            color: #000;
            background: #fff;
          }

          .print-header {
            border-bottom: 2px solid #000;
            margin-bottom: 20px;
            padding-bottom: 10px;
          }

          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }

          .print-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }

          .print-footer {
            margin-top: 30px;
            border-top: 1px solid #000;
            padding-top: 10px;
            font-size: 12px;
          }
        }
      `}</style>

      <div className="print-container">
        {/* Header */}
        <div className="print-header">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
                {companyName}
              </h1>
              <h2
                style={{
                  margin: "5px 0 0 0",
                  fontSize: "18px",
                  fontWeight: "normal",
                }}
              >
                Werkrooster
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                {format(new Date(selectedDate), "EEEE d MMMM yyyy", {
                  locale: nl,
                })}
              </div>
              <div style={{ fontSize: "12px", marginTop: "5px" }}>
                Gegenereerd op:{" "}
                {format(new Date(), "dd-MM-yyyy HH:mm", { locale: nl })}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Title and Description */}
        {schedule.title && (
          <div style={{ marginBottom: "15px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>
              {schedule.title}
            </h3>
          </div>
        )}

        {schedule.description && (
          <div style={{ marginBottom: "15px", fontSize: "14px" }}>
            {schedule.description}
          </div>
        )}

        {/* Summary */}
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            backgroundColor: "#f9f9f9",
            border: "1px solid #ddd",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>Totaal aantal diensten:</strong> {schedule.shifts.length}
            </div>
            <div>
              <strong>Totaal uren:</strong> {calculateTotalHours().toFixed(1)}{" "}
              uur
            </div>
          </div>
        </div>

        {/* Shifts Table */}
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: "20%" }}>Medewerker</th>
              <th style={{ width: "15%" }}>Tijd</th>
              <th style={{ width: "20%" }}>Project</th>
              <th style={{ width: "15%" }}>Bedrijf</th>
              <th style={{ width: "10%" }}>Rol</th>
              <th style={{ width: "10%" }}>Status</th>
              <th style={{ width: "10%" }}>Opmerkingen</th>
            </tr>
          </thead>
          <tbody>
            {schedule.shifts
              .sort(
                (a, b) =>
                  new Date(a.startTime).getTime() -
                  new Date(b.startTime).getTime()
              )
              .map((shift) => (
                <tr key={shift.id}>
                  <td>
                    <div style={{ fontWeight: "bold" }}>{shift.user.name}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {shift.user.email}
                    </div>
                  </td>
                  <td>
                    <div>{formatTime(shift.startTime)}</div>
                    <div>{formatTime(shift.endTime)}</div>
                    <div style={{ fontSize: "11px", color: "#666" }}>
                      (
                      {(
                        (new Date(shift.endTime).getTime() -
                          new Date(shift.startTime).getTime()) /
                        (1000 * 60 * 60)
                      ).toFixed(1)}
                      h)
                    </div>
                  </td>
                  <td>{shift.project?.name || "-"}</td>
                  <td>{shift.project?.company || "-"}</td>
                  <td>{shift.role || "-"}</td>
                  <td>{getStatusText(shift.status)}</td>
                  <td style={{ fontSize: "12px" }}>{shift.notes || "-"}</td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="print-footer">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div>
                <strong>Contactgegevens:</strong>
              </div>
              <div>Email: info@jobflow.nl</div>
              <div>Telefoon: +31 (0)20 123 4567</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div>
                <strong>Handtekening Manager:</strong>
              </div>
              <div
                style={{
                  marginTop: "30px",
                  borderBottom: "1px solid #000",
                  width: "200px",
                }}
              ></div>
              <div style={{ fontSize: "10px", marginTop: "5px" }}>
                Naam en datum
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableSchedule;
