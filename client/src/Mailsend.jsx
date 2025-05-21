const Mailsend = async () => {
    try {
      const response = await fetch('/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: 'user@example.com',
          subject: 'New Scheme Alert',
          body: '<p>You are eligible for a new scheme!</p>'
        })
      });
      const result = await response.json();
      console.log(result.success ? "Email sent!" : "Failed to send");
    } catch (error) {
      console.error("Error:", error);
    }
  };

export default Mailsend;