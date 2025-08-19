export default function BamxPro() {
  return (
    <div className="min-h-screen w-full bg-background">
      <iframe
        src="https://b-maxpro2.netlify.app"
        title="B-maxPro Demo"
        className="w-full min-h-screen"
        style={{ border: 0 }}
        allow="clipboard-write; microphone; camera; geolocation; autoplay"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
