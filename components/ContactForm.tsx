"use client";

import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <div className="form-success">
        <p className="display">Message sent</p>
        <p className="serif muted">Thank you — we&rsquo;ll be in touch shortly.</p>
      </div>
    );
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <label>
        <span className="mono-xxs">Name</span>
        <input required name="name" autoComplete="name" />
      </label>
      <label>
        <span className="mono-xxs">Email</span>
        <input required type="email" name="email" autoComplete="email" />
      </label>
      <label>
        <span className="mono-xxs">Topic</span>
        <select name="topic" defaultValue="order">
          <option value="order">An order</option>
          <option value="print">Printing & framing</option>
          <option value="trade">Trade & licensing</option>
          <option value="other">Something else</option>
        </select>
      </label>
      <label>
        <span className="mono-xxs">Message</span>
        <textarea required name="message" rows={5} />
      </label>
      <button className="btn btn--black btn--block">Send message</button>
    </form>
  );
}
