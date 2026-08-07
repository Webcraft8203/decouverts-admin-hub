/**
 * SEO landing page content.
 * Pure content data — no business logic, no API calls.
 * Each entry renders through src/pages/SeoLanding.tsx.
 */

export interface SeoFaq {
  q: string;
  a: string;
}

export interface SeoLandingPage {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  eyebrow: string;
  intro: string;
  /** 4–6 capability cards */
  capabilities: { title: string; body: string }[];
  /** Long-form body sections */
  sections: { heading: string; body: string }[];
  faqs: SeoFaq[];
  /** Slugs of related landing pages for internal linking */
  related: string[];
}

const COMPANY = "Decouvertes Future Technologies Pvt. Ltd.";

export const seoLandingPages: SeoLandingPage[] = [
  {
    slug: "drone-manufacturer-india",
    title: "Drone Manufacturer in India | UAV Manufacturing | Decouvertes",
    description:
      "Decouvertes Future Technologies is an Indian drone manufacturer building defence UAVs, surveillance drones, AI-powered platforms and custom drone systems from Pune, Maharashtra.",
    keywords: [
      "drone manufacturer india",
      "drone manufacturers india",
      "indian drone company",
      "drone company india",
      "make in india drone",
      "indian uav manufacturer",
      "drone company pune",
    ],
    eyebrow: "Made in India",
    h1: "Drone Manufacturer in India",
    intro:
      `${COMPANY} designs, engineers and manufactures unmanned aerial systems in India. Our work spans airframe design, flight electronics, autonomy software and mission payload integration — developed in-house so every platform can be tuned to the mission rather than assembled from off-the-shelf parts.`,
    capabilities: [
      { title: "In-house airframe design", body: "Multirotor, fixed wing and VTOL airframes engineered for endurance, payload capacity and field serviceability." },
      { title: "Flight electronics", body: "Autopilot integration, power distribution, telemetry and communication stacks built and bench-tested in our own lab." },
      { title: "Autonomy software", body: "Waypoint and mission planning, onboard processing and autonomous behaviours developed by our engineering team." },
      { title: "Payload integration", body: "EO/IR, thermal, mapping and custom sensor payloads mechanically and electrically integrated into the platform." },
      { title: "Prototype to production", body: "Rapid prototyping, iterative flight testing and validation before a design moves into repeatable manufacturing." },
      { title: "Indigenous R&D", body: "Research and development carried out in India, supporting self-reliance in unmanned systems technology." },
    ],
    sections: [
      {
        heading: "Why manufacture drones in India",
        body: "Indian operators — defence, homeland security, industrial and research — increasingly need platforms that can be supported, repaired and upgraded locally. A domestically engineered UAV means shorter supply chains, faster iteration on operator feedback, and the ability to adapt airframes and payloads to Indian terrain and operating conditions. Decouvertes builds with that principle: the design authority stays in-house, so changes requested by an operator turn into a validated update instead of a vendor request.",
      },
      {
        heading: "Our engineering process",
        body: "Every programme starts with a requirement study — endurance, range, payload mass, environment and mission profile. From there our team runs concept design, structural and aerodynamic analysis, electronics layout and software architecture. Prototypes are built and flown through a structured test campaign, and results feed back into the design. Only after validation does a platform move to manufacturing, with documented build standards and inspection steps.",
      },
      {
        heading: "Who we build for",
        body: "Defence and paramilitary users needing tactical ISR, security agencies running perimeter and border surveillance, industrial customers doing inspection, survey and mapping, and academic or research institutions who need a configurable platform for their own experiments.",
      },
    ],
    faqs: [
      { q: "Who manufactures drones in India?", a: "Several Indian companies manufacture drones across consumer, industrial and defence segments. Decouvertes Future Technologies is an India-based UAV manufacturer focused on defence, surveillance and R&D-driven unmanned systems, with design and engineering carried out in-house in Pune, Maharashtra." },
      { q: "Does Decouvertes build custom drones?", a: "Yes. We take mission requirements — endurance, payload, range, environment — and engineer a platform around them, rather than adapting a fixed product. Custom development covers airframe, electronics, software and payload integration." },
      { q: "Where is Decouvertes located?", a: "Our office is in Pimpri-Chinchwad, Pune, Maharashtra, India." },
      { q: "Can I request a product catalogue?", a: "Yes. Use the contact form on this site to request a catalogue or to schedule a technical discussion with our engineering team." },
    ],
    related: ["uav-manufacturer", "defence-drone", "custom-drone-development", "drone-r-and-d"],
  },
  {
    slug: "defence-drone",
    title: "Defence Drone Company India | Defence UAV Systems | Decouvertes",
    description:
      "Defence drone systems engineered in India — tactical ISR UAVs, secure communication links, ruggedised airframes and mission payloads by Decouvertes Future Technologies.",
    keywords: ["defence drone", "defence drones", "defense drones", "defence uav", "indian defence startup", "defence technology", "defence drone company india"],
    eyebrow: "Defence Technology",
    h1: "Defence Drone Systems",
    intro:
      "Defence users need unmanned systems that stay reliable when conditions are not. Decouvertes engineers defence-oriented UAV platforms with ruggedised airframes, resilient communication links and payloads selected for the mission rather than the spec sheet.",
    capabilities: [
      { title: "Tactical ISR platforms", body: "Man-portable and vehicle-deployable UAVs configured for intelligence, surveillance and reconnaissance tasks." },
      { title: "Ruggedised airframes", body: "Structures designed for field handling, dust, vibration and repeated deployment cycles." },
      { title: "Resilient links", body: "Communication and telemetry architectures designed with degradation and interference in mind." },
      { title: "Mission payloads", body: "Day/night electro-optical, thermal and custom sensing payloads with integrated ground display." },
      { title: "Operator-first ground control", body: "Ground control workflows built for fast launch, simple mission entry and clear situational display." },
      { title: "Indigenous development", body: "Design, software and integration performed in India to support defence self-reliance goals." },
    ],
    sections: [
      {
        heading: "What makes a UAV a defence platform",
        body: "The difference is rarely the airframe alone. A defence UAV has to survive rough handling and transport, launch quickly with minimal setup, hold a link in cluttered RF environments, keep flying when GNSS is degraded, and give the operator usable intelligence rather than raw video. Those requirements shape structural design, electronics redundancy, software behaviour under fault, and how the ground station presents information.",
      },
      {
        heading: "Engineering approach",
        body: "We treat failure modes as a design input. Power architecture, link loss behaviour, return-to-home logic and payload gimbal control are all specified against what the platform should do when something goes wrong. Test campaigns include deliberate degradation — link interruption, GNSS denial, wind and temperature extremes — so behaviour is known before deployment.",
      },
      {
        heading: "Working with us",
        body: "Defence programmes usually begin with a requirement discussion under an appropriate confidentiality arrangement. From there we can propose a platform configuration, a development timeline and a validation plan. Contact our engineering team to schedule a defence consultation.",
      },
    ],
    faqs: [
      { q: "What is a defence UAV?", a: "A defence UAV is an unmanned aerial vehicle configured for military or security use. Compared with commercial drones it emphasises ruggedness, rapid deployment, resilient communication, operation in GNSS-degraded conditions, and mission payloads such as electro-optical or thermal sensors." },
      { q: "How is a defence drone different from a commercial drone?", a: "Defence platforms are designed around adversarial and austere conditions: interference, jamming, dust, temperature extremes and rough handling. Commercial drones optimise for cost, ease of use and imaging quality in benign conditions." },
      { q: "Does Decouvertes work with Indian defence organisations?", a: "We develop defence-oriented unmanned systems in India and engage with defence and security users through technical requirement discussions. Contact us to start that conversation." },
    ],
    related: ["military-drones", "isr-drone", "surveillance-drone", "counter-drone"],
  },
  {
    slug: "military-drones",
    title: "Military Drones India | Tactical Military UAV Systems | Decouvertes",
    description:
      "Military drone and tactical UAV development in India. Decouvertes engineers reconnaissance, surveillance and mission-configurable military unmanned aerial systems.",
    keywords: ["military drone", "military drones", "military uav", "tactical uav", "tactical drones", "combat drone", "reconnaissance drone"],
    eyebrow: "Military UAV",
    h1: "Military Drone & Tactical UAV Systems",
    intro:
      "Military unmanned systems have to be judged by what they deliver at the edge — time on station, quality of intelligence, and how quickly a small team can get them airborne. Decouvertes develops tactical UAV platforms around those operational realities.",
    capabilities: [
      { title: "Reconnaissance", body: "Platforms configured to observe, record and relay a target area without exposing personnel." },
      { title: "Rapid deployment", body: "Short setup time, minimal ground equipment and simple pre-flight procedure for small teams." },
      { title: "Endurance focus", body: "Aerodynamic and power system design aimed at maximising useful time on station." },
      { title: "Modular payload bays", body: "Mission payloads swapped in the field without redesigning the platform." },
      { title: "Degraded-environment flight", body: "Behaviour engineered for GNSS-denied, low-visibility and high-interference conditions." },
      { title: "Training and support", body: "Operator familiarisation and maintenance documentation supplied with each platform." },
    ],
    sections: [
      {
        heading: "Tactical UAV classes",
        body: "Tactical unmanned systems typically fall into short-range multirotors for immediate over-the-hill observation, fixed-wing platforms for longer range and endurance, and VTOL hybrids that combine vertical launch with efficient forward flight. The right class depends on launch constraints, required range and how long the aircraft must remain on station.",
      },
      {
        heading: "Intelligence, not just video",
        body: "A military UAV earns its place by shortening the loop between observation and decision. That means stabilised imaging, accurate geolocation of what is being observed, reliable downlink and a ground display that an operator can read under pressure. We design the sensor, processing and display chain as one system.",
      },
      {
        heading: "Development and validation",
        body: "Military-oriented platforms are validated through structured flight test: performance envelope, endurance verification, payload accuracy, link range and fault behaviour. Results are documented so the operator knows the platform's real limits, not marketing figures.",
      },
    ],
    faqs: [
      { q: "What is a military drone?", a: "A military drone is an unmanned aerial vehicle operated by armed forces for missions such as reconnaissance, surveillance, target observation, communication relay or logistics. It is engineered for rugged field use, resilient communication and operation in contested environments." },
      { q: "What is a tactical UAV?", a: "A tactical UAV is a small to medium unmanned aircraft operated at unit level, usually launched by a small team close to the area of interest, providing short-notice aerial observation without dependence on higher-echelon assets." },
      { q: "What is a reconnaissance drone?", a: "A reconnaissance drone is a UAV configured primarily to gather visual or sensor information about an area or target, typically carrying stabilised electro-optical and thermal imaging with accurate position reporting." },
    ],
    related: ["defence-drone", "isr-drone", "fixed-wing-drone", "fpv-drone"],
  },
  {
    slug: "counter-drone",
    title: "Counter Drone Systems India | Anti Drone & Counter UAV | Decouvertes",
    description:
      "Counter drone and counter UAV technology — drone detection, tracking, identification and mitigation research by Decouvertes Future Technologies, India.",
    keywords: ["counter drone", "counter uav", "anti drone", "drone detection", "drone tracking", "drone jamming", "drone defense", "counter drone systems"],
    eyebrow: "Counter UAS",
    h1: "Counter Drone & Anti Drone Systems",
    intro:
      "The same technology that makes small UAVs useful makes them a threat when operated by someone else. Counter drone work at Decouvertes focuses on the detect–track–identify–respond chain and the engineering behind each stage.",
    capabilities: [
      { title: "Detection", body: "Research into RF, radar, acoustic and optical detection methods for small, low and slow aerial targets." },
      { title: "Tracking", body: "Maintaining a continuous track on a target once detected, including through sensor handover." },
      { title: "Identification", body: "Distinguishing an unauthorised UAV from birds, aircraft and cooperative traffic before any response." },
      { title: "Mitigation research", body: "Study of response options and their operational, legal and safety constraints." },
      { title: "Sensor fusion", body: "Combining multiple sensing modalities so no single method has to carry the full detection burden." },
      { title: "Site assessment", body: "Understanding the protected asset, its airspace and the realistic threat profile before proposing a system." },
    ],
    sections: [
      {
        heading: "Why counter-UAS is hard",
        body: "Small drones present a difficult target: low radar cross-section, low altitude, slow speed, and flight profiles that resemble clutter or wildlife. Urban and industrial sites add RF noise and physical obstruction. A workable counter-UAS deployment therefore relies on layering complementary sensors rather than trusting one technology, and on a clear identification step so responses are not triggered by false positives.",
      },
      {
        heading: "Detect, track, identify, respond",
        body: "Detection answers whether something is there. Tracking maintains where it is and where it is going. Identification determines what it is and whether it is authorised. Only then does a response decision make sense. Skipping or weakening any stage produces either missed threats or unusable false-alarm rates.",
      },
      {
        heading: "Legal and safety context",
        body: "Mitigation options are constrained by national regulation and by the safety of people and infrastructure around the protected site. Any counter-drone deployment has to be planned within the applicable Indian regulatory framework, and we scope engagements on that basis.",
      },
    ],
    faqs: [
      { q: "What are counter drone systems?", a: "Counter drone systems, also called counter-UAS or anti-drone systems, detect, track, identify and where legally permitted mitigate unauthorised unmanned aircraft near a protected site. They typically combine RF sensing, radar, optical and acoustic detection with a command interface." },
      { q: "How are drones detected?", a: "Common methods include RF sensing of the control and video links, radar returns, acoustic signatures, and electro-optical or thermal cameras. Each has blind spots, so practical systems fuse several sensors." },
      { q: "Is drone jamming legal in India?", a: "Use of jamming and other active mitigation is restricted and governed by Indian regulation and authorisation. Any deployment must be planned with the applicable legal framework and the relevant authorities." },
    ],
    related: ["defence-drone", "surveillance-drone", "drone-electronics", "drone-r-and-d"],
  },
  {
    slug: "uav-manufacturer",
    title: "UAV Manufacturer India | Unmanned Aerial Vehicle Systems | Decouvertes",
    description:
      "Indian UAV manufacturer building unmanned aerial vehicles and unmanned aircraft systems — multirotor, fixed wing and VTOL platforms engineered by Decouvertes.",
    keywords: ["uav", "uavs", "uas", "unmanned aerial vehicle", "unmanned aircraft", "uav manufacturer", "indian uav manufacturer", "quadcopter manufacturer", "hexacopter"],
    eyebrow: "Unmanned Systems",
    h1: "UAV Manufacturer & Unmanned Aircraft Systems",
    intro:
      "A UAV is only one part of an unmanned aircraft system. Decouvertes engineers the complete stack — air vehicle, ground control, communication link, payload and support equipment — so the parts are designed to work together rather than integrated after the fact.",
    capabilities: [
      { title: "Multirotor platforms", body: "Quadcopter and hexacopter configurations for vertical launch, hover-capable observation and confined-area operation." },
      { title: "Fixed wing platforms", body: "Efficient forward flight for range and endurance-driven missions." },
      { title: "VTOL hybrids", body: "Vertical launch and recovery combined with fixed-wing cruise efficiency." },
      { title: "Ground control systems", body: "Mission planning, live telemetry, payload control and recording in one operator interface." },
      { title: "Communication links", body: "Command, telemetry and video link design matched to the required range and environment." },
      { title: "Support equipment", body: "Transport cases, batteries, charging and field spares specified as part of the system." },
    ],
    sections: [
      {
        heading: "UAV, UAS and drone — the terminology",
        body: "UAV refers to the aircraft itself. UAS, or unmanned aircraft system, refers to the aircraft together with the ground control station, communication links, payloads and support equipment needed to operate it. 'Drone' is the everyday term for the same thing. Getting the distinction right matters in procurement, because buying only the air vehicle rarely delivers an operational capability.",
      },
      {
        heading: "Choosing a platform type",
        body: "Multirotors launch anywhere, hover, and are simple to operate, but trade endurance. Fixed wings fly further for the same energy but need launch and recovery space. VTOL hybrids remove the launch constraint at the cost of added complexity and mass. The right choice follows from the mission — required time on station, distance to the area of interest, and available launch area.",
      },
      {
        heading: "Manufacturing and quality",
        body: "Repeatability matters as much as design. Build standards, component traceability, bench testing of electronics and a documented pre-delivery flight check are part of how a platform leaves our facility.",
      },
    ],
    faqs: [
      { q: "What is the difference between a UAV and a UAS?", a: "A UAV is the unmanned aerial vehicle itself. A UAS, or unmanned aircraft system, is the complete system: the aircraft plus ground control station, communication links, payloads and support equipment." },
      { q: "What types of UAV does Decouvertes build?", a: "We work across multirotor (quadcopter and hexacopter), fixed wing and VTOL hybrid configurations, selecting the class based on the mission requirement." },
      { q: "Can a UAV platform be customised?", a: "Yes. Airframe, payload bay, electronics and software can be configured for specific endurance, payload and environmental requirements." },
    ],
    related: ["drone-manufacturer-india", "fixed-wing-drone", "vtol-drone", "custom-drone-development"],
  },
  {
    slug: "autonomous-drone",
    title: "Autonomous Drone Systems India | Drone Autonomy | Decouvertes",
    description:
      "Autonomous drone development — autonomous navigation, mission execution, GPS-denied flight and onboard decision making engineered by Decouvertes Future Technologies.",
    keywords: ["autonomous drone", "drone automation", "drone autopilot", "drone navigation", "gps denied drone", "drone control systems", "autonomous uav"],
    eyebrow: "Autonomy",
    h1: "Autonomous Drone Systems",
    intro:
      "Autonomy is a spectrum, not a switch. Decouvertes develops drone autonomy in defined levels — from assisted flight and waypoint missions through to onboard decision making that keeps working when the link or GNSS does not.",
    capabilities: [
      { title: "Mission autonomy", body: "Plan a mission once, and the aircraft executes the route, payload actions and recovery without continuous input." },
      { title: "Onboard processing", body: "Companion computing for perception and decision making that does not depend on a live downlink." },
      { title: "GNSS-degraded navigation", body: "Research into visual, inertial and alternative navigation for environments where GPS is unreliable or denied." },
      { title: "Obstacle awareness", body: "Sensing and avoidance behaviour for cluttered and low-altitude flight." },
      { title: "Fault handling", body: "Defined, tested behaviour for link loss, sensor failure and low energy states." },
      { title: "Fleet and multi-vehicle research", body: "Coordination concepts for operating more than one vehicle on a shared task." },
    ],
    sections: [
      {
        heading: "Levels of autonomy",
        body: "At the base level, stabilisation and position hold reduce pilot workload. Above that, waypoint and mission autonomy execute a pre-planned route. Higher levels add onboard perception so the aircraft can react to what it observes — adjusting a route around an obstacle, re-acquiring a target, or choosing a safe landing area. Each level adds capability but also adds validation burden, so we scope autonomy to what the mission genuinely needs.",
      },
      {
        heading: "GPS-denied navigation",
        body: "Satellite navigation can be blocked by terrain, buildings, indoor operation or deliberate interference. Alternative approaches use inertial measurement fused with visual odometry, optical flow, terrain matching or ranging sensors to maintain a position estimate. The engineering challenge is drift management and graceful degradation — knowing how confident the estimate is and behaving accordingly.",
      },
      {
        heading: "Validating autonomous behaviour",
        body: "Autonomous behaviour is only trustworthy if it has been tested against failure. Our test campaigns deliberately induce link loss, GNSS denial, sensor dropout and energy limits, and record how the aircraft responds, so that behaviour is documented rather than assumed.",
      },
    ],
    faqs: [
      { q: "What is an autonomous drone?", a: "An autonomous drone executes a mission without continuous manual piloting. Depending on its level of autonomy it may follow a planned route, control its payload, react to sensed obstacles, and handle faults such as link loss on its own." },
      { q: "What is GPS-denied navigation?", a: "GPS-denied navigation is the ability of a drone to determine its position and fly a mission when satellite navigation is unavailable or unreliable, using alternatives such as inertial sensing fused with visual odometry, optical flow or terrain reference." },
      { q: "Is an autonomous drone the same as an automatic drone?", a: "No. An automatic system repeats a fixed pre-programmed sequence. An autonomous system perceives its situation and adapts its actions within defined limits." },
    ],
    related: ["ai-drone", "drone-software", "drone-ai", "drone-r-and-d"],
  },
  {
    slug: "ai-drone",
    title: "AI Drone Technology India | AI Powered UAV Systems | Decouvertes",
    description:
      "AI drones and AI-powered UAV systems — onboard perception, detection, tracking and aerial analytics engineered in India by Decouvertes Future Technologies.",
    keywords: ["ai drone", "ai drones", "drone ai", "drone analytics", "aerial intelligence", "ai powered uav", "drone technology"],
    eyebrow: "Artificial Intelligence",
    h1: "AI Drones & Aerial Intelligence",
    intro:
      "Aerial video is only valuable if someone extracts meaning from it. Applying machine learning onboard the aircraft turns raw imagery into detections, tracks and alerts at the point of capture, instead of hours later at a desk.",
    capabilities: [
      { title: "Onboard inference", body: "Running perception models on companion hardware so results are available in flight, not after landing." },
      { title: "Detection and classification", body: "Identifying objects of interest in electro-optical and thermal imagery." },
      { title: "Visual tracking", body: "Locking onto and following a detected object across frames and through the gimbal." },
      { title: "Change detection", body: "Comparing repeat surveys of the same area to surface what has changed." },
      { title: "Aerial analytics", body: "Turning collected imagery into counts, measurements and structured reports." },
      { title: "Edge–ground split", body: "Deciding what runs onboard and what runs on the ground based on bandwidth and latency constraints." },
    ],
    sections: [
      {
        heading: "Why onboard AI matters",
        body: "Downlink bandwidth is limited and often contested. Streaming full-resolution video to the ground for processing wastes the link and adds latency to every decision. Running detection onboard means the aircraft can transmit compact results — a detection, a coordinate, a cropped frame — and reserve the link for what the operator actually needs to see.",
      },
      {
        heading: "Data and model development",
        body: "Aerial imagery is a different problem from ground-level datasets: small objects, oblique angles, varied altitude and lighting, and thermal as well as visible spectra. Useful models need data collected under representative conditions, careful annotation, and honest evaluation on held-out flights rather than on the data they were trained with.",
      },
      {
        heading: "Practical constraints",
        body: "Onboard compute is limited by mass and power, which are the two things a UAV has least of. Model selection, quantisation and pipeline design all sit inside that budget, and we treat the perception stack as an aircraft subsystem with a mass and power allocation like any other.",
      },
    ],
    faqs: [
      { q: "What are AI drones?", a: "AI drones are unmanned aircraft that run machine learning models — usually onboard — to interpret sensor data in flight. Typical functions include detecting and classifying objects, tracking a target, and generating analytics from aerial imagery." },
      { q: "Does AI run on the drone or on the ground?", a: "It can run in either place. Onboard inference reduces latency and link usage; ground processing allows heavier models. Most practical systems split the workload between the two." },
      { q: "What can AI detect from a drone?", a: "Depending on the trained model and sensor, typical outputs include vehicles, people, infrastructure features, and changes between repeat surveys of the same area." },
    ],
    related: ["drone-ai", "autonomous-drone", "drone-software", "isr-drone"],
  },
  {
    slug: "surveillance-drone",
    title: "Surveillance Drone India | Security & Border Surveillance UAV | Decouvertes",
    description:
      "Surveillance drones for security, border and perimeter monitoring — thermal imaging, night operation and persistent aerial observation by Decouvertes, India.",
    keywords: ["surveillance drone", "surveillance drones", "drone surveillance", "border surveillance", "security drone", "thermal drone", "thermal imaging drone", "night vision drone", "homeland security"],
    eyebrow: "Surveillance",
    h1: "Surveillance Drones & Aerial Security",
    intro:
      "A surveillance UAV replaces a fixed camera's single viewpoint with one that can be moved, raised and re-tasked in minutes. Decouvertes builds surveillance platforms around persistence, imaging quality and how quickly an operator can act on what they see.",
    capabilities: [
      { title: "Day/night imaging", body: "Electro-optical and thermal sensors so observation continues after dark and through low visibility." },
      { title: "Perimeter and site security", body: "Rapid overwatch of installations, industrial sites and event perimeters." },
      { title: "Border and area monitoring", body: "Coverage of long boundaries and open terrain where fixed sensors are impractical." },
      { title: "Stabilised gimbals", body: "Steady imagery and accurate pointing at range, with operator-controlled slew and zoom." },
      { title: "Geolocation of observations", body: "Reporting the ground coordinate of what the camera is looking at, not just the aircraft position." },
      { title: "Recording and handover", body: "Onboard and ground recording with clean handover of imagery to the responding team." },
    ],
    sections: [
      {
        heading: "Thermal versus visible imaging",
        body: "Visible-spectrum cameras give detail and context in daylight. Thermal sensors detect heat difference, which makes people and vehicles stand out at night, through smoke and haze, and against cluttered backgrounds. Most serious surveillance payloads carry both, because each answers a question the other cannot.",
      },
      {
        heading: "Persistence and coverage",
        body: "Surveillance value scales with time on station. Endurance, battery swap procedure, and the ability to keep one aircraft airborne while another recovers all determine whether a site actually stays covered. We plan surveillance deployments around continuous-coverage arithmetic rather than single-flight endurance figures.",
      },
      {
        heading: "Privacy and lawful use",
        body: "Aerial surveillance must be conducted within Indian aviation regulation and applicable privacy law. Deployments should be scoped to a defined security purpose over authorised areas, with recorded data handled under a clear retention policy.",
      },
    ],
    faqs: [
      { q: "What is a surveillance drone?", a: "A surveillance drone is a UAV carrying imaging sensors — typically electro-optical and thermal — used to observe an area, site or boundary from the air and relay live imagery to an operator on the ground." },
      { q: "Can surveillance drones fly at night?", a: "Yes, when fitted with thermal imaging or low-light sensors and operated in line with applicable regulation. Thermal imaging in particular allows detection of people and vehicles in darkness." },
      { q: "What is a thermal drone used for?", a: "Thermal drones are used for night surveillance, search and rescue, perimeter security, electrical and mechanical inspection, and any task where heat difference reveals what a visible camera cannot." },
    ],
    related: ["isr-drone", "defence-drone", "counter-drone", "ai-drone"],
  },
  {
    slug: "isr-drone",
    title: "ISR Drone Solutions India | Intelligence Surveillance Reconnaissance | Decouvertes",
    description:
      "ISR drones and ISR solutions — intelligence, surveillance and reconnaissance UAV platforms with sensor fusion and mission analytics by Decouvertes Future Technologies.",
    keywords: ["isr drone", "isr drones", "isr solutions", "aerial intelligence", "intelligence surveillance reconnaissance", "reconnaissance drone"],
    eyebrow: "ISR",
    h1: "ISR Drone Solutions",
    intro:
      "ISR — intelligence, surveillance and reconnaissance — describes a workflow, not a product. Decouvertes builds ISR platforms that address the whole chain: collect the right data, process it usefully, and get it to the person who has to act.",
    capabilities: [
      { title: "Collection", body: "Sensor payloads and flight profiles designed for the specific information requirement." },
      { title: "Processing", body: "Onboard and ground processing that reduces raw sensor output to usable products." },
      { title: "Exploitation", body: "Operator tools for reviewing, marking and geolocating items of interest." },
      { title: "Dissemination", body: "Getting the resulting picture to the people who need it, in a format they can use." },
      { title: "Sensor fusion", body: "Combining electro-optical, thermal and positional data into a single coherent view." },
      { title: "Mission recording", body: "Full-mission capture for after-action review and evidentiary use." },
    ],
    sections: [
      {
        heading: "Intelligence, surveillance and reconnaissance",
        body: "The three terms describe different tasks. Reconnaissance is a targeted look at a specific place or object at a specific time. Surveillance is sustained observation of an area over a period. Intelligence is the product of analysing what was collected, in context, to answer a question. A UAV can support all three, but the platform configuration and flight profile differ for each.",
      },
      {
        heading: "From sensor to decision",
        body: "The bottleneck in ISR is rarely collection — it is the time between capture and understanding. Reducing that time means processing closer to the sensor, tagging observations with accurate ground coordinates, and presenting the operator with a picture rather than a video feed to scan manually.",
      },
      {
        heading: "Multi-sensor missions",
        body: "A single sensor rarely answers the question alone. Thermal shows presence, visible shows identity, position data ties both to a map. Designing the payload and the data pipeline together is what turns three data streams into one usable product.",
      },
    ],
    faqs: [
      { q: "What is an ISR drone?", a: "An ISR drone is an unmanned aircraft configured for intelligence, surveillance and reconnaissance. It carries sensors — commonly electro-optical and thermal — and supports the full workflow of collecting, processing, exploiting and disseminating the resulting information." },
      { q: "What does ISR stand for?", a: "ISR stands for Intelligence, Surveillance and Reconnaissance." },
      { q: "What sensors do ISR drones carry?", a: "Typically stabilised electro-optical cameras and thermal imagers, with accurate positioning so observations can be geolocated. Mission-specific sensors can be added depending on the information requirement." },
    ],
    related: ["surveillance-drone", "military-drones", "drone-payload", "ai-drone"],
  },
  {
    slug: "drone-r-and-d",
    title: "Drone R&D India | UAV Research & Development | Decouvertes",
    description:
      "Drone research and development in India — UAV prototyping, flight testing, product validation and indigenous innovation at Decouvertes Future Technologies.",
    keywords: ["drone r&d", "drone research", "drone innovation", "drone prototyping", "drone development", "drone engineering", "uav research", "drone innovations india"],
    eyebrow: "Research & Development",
    h1: "Drone Research & Development",
    intro:
      "Decouvertes is an R&D-led company. Product lines come out of research programmes rather than the other way round, and the same lab that runs experiments builds the platforms that ship.",
    capabilities: [
      { title: "Concept studies", body: "Feasibility, trade studies and configuration selection before any hardware is cut." },
      { title: "Rapid prototyping", body: "In-house fabrication so a design change becomes a flyable article quickly." },
      { title: "Flight test campaigns", body: "Structured testing of performance, endurance, payload and fault behaviour." },
      { title: "Instrumented testing", body: "Logged flight data used to validate models and drive the next design iteration." },
      { title: "Product validation", body: "Verifying that a design meets its stated requirement before it becomes a product." },
      { title: "Collaborative research", body: "Working with academic and institutional partners on specific technical problems." },
    ],
    sections: [
      {
        heading: "How our R&D runs",
        body: "A programme begins with a clearly written requirement and an explicit list of unknowns. Each unknown gets an experiment — a bench test, a simulation or a flight — designed to resolve it. Results are recorded and reviewed, and the design either advances or the requirement is revised. This keeps development honest: progress is measured by unknowns eliminated, not hours spent.",
      },
      {
        heading: "Prototype to product",
        body: "A working prototype is not a product. Between the two sit repeatability, manufacturability, documentation, serviceability and validation across the full operating envelope. We treat that transition as its own engineering phase with its own exit criteria.",
      },
      {
        heading: "Indigenous innovation",
        body: "Carrying out research in India means the resulting knowledge, tooling and design authority stay here. That matters for defence and strategic applications, and it means Indian operators can get changes made rather than requested.",
      },
    ],
    faqs: [
      { q: "What does drone R&D involve?", a: "Drone R&D covers concept and trade studies, aerodynamic and structural design, electronics and software development, prototype fabrication, instrumented flight testing, and validation of the design against its requirements." },
      { q: "Can Decouvertes run a research programme for us?", a: "Yes. We take defined technical problems in unmanned systems and run them as structured R&D programmes with agreed milestones and documented results. Contact our engineering team to discuss scope." },
      { q: "Do you work with academic institutions?", a: "We are open to collaborative research on specific technical problems in unmanned systems, autonomy and aerial perception." },
    ],
    related: ["custom-drone-development", "drone-engineering-consulting", "drone-manufacturer-india", "autonomous-drone"],
  },
  {
    slug: "drone-services",
    title: "Drone Services India | UAV Survey, Mapping & Inspection | Decouvertes",
    description:
      "Professional drone services in India — aerial survey, mapping, photogrammetry, industrial inspection and data analysis by Decouvertes Future Technologies.",
    keywords: ["drone services", "drone solutions india", "mapping drone", "gis drone", "photogrammetry drone", "inspection drone", "industrial drone", "enterprise drone"],
    eyebrow: "Services",
    h1: "Drone Services: Survey, Mapping & Inspection",
    intro:
      "Beyond building platforms, Decouvertes operates them. Aerial survey, mapping and inspection work delivers measured data and documented condition reports rather than just imagery.",
    capabilities: [
      { title: "Aerial survey", body: "Planned flight grids producing consistent, georeferenced coverage of a site." },
      { title: "Photogrammetry", body: "Orthomosaics, digital surface models and point clouds generated from overlapping imagery." },
      { title: "GIS-ready outputs", body: "Deliverables in formats that drop directly into existing GIS and CAD workflows." },
      { title: "Industrial inspection", body: "Close visual and thermal inspection of structures and installations without scaffolding or rope access." },
      { title: "Progress monitoring", body: "Repeat surveys of the same site to track change over a project timeline." },
      { title: "Thermal inspection", body: "Detecting heat anomalies in electrical and mechanical installations." },
    ],
    sections: [
      {
        heading: "What you receive",
        body: "Survey engagements deliver processed products, not raw files: orthomosaic imagery, elevation models, point clouds where required, and a report describing collection parameters and accuracy. Inspection engagements deliver annotated imagery with location references and a written summary of observed condition.",
      },
      {
        heading: "Accuracy and ground control",
        body: "Positional accuracy depends on flight planning, camera calibration and ground reference. Where survey-grade accuracy is required, ground control points or RTK/PPK positioning are used and the achieved accuracy is stated in the deliverable rather than assumed.",
      },
      {
        heading: "Safety and compliance",
        body: "Operations are planned around airspace authorisation, site risk assessment and applicable Indian drone regulation. Site-specific safety briefings and exclusion planning are part of every engagement.",
      },
    ],
    faqs: [
      { q: "What drone services does Decouvertes offer?", a: "Aerial survey and mapping, photogrammetry, industrial and structural inspection, thermal inspection and repeat progress monitoring, delivered as processed data products and reports." },
      { q: "What is a photogrammetry drone?", a: "A photogrammetry drone flies a planned grid capturing overlapping images, which are processed into orthomosaic maps, digital surface models and 3D point clouds with real-world coordinates." },
      { q: "How accurate is drone survey data?", a: "Accuracy depends on flight altitude, camera, positioning method and ground control. With ground control points or RTK/PPK positioning, centimetre-level accuracy is achievable; the achieved accuracy is reported with each deliverable." },
    ],
    related: ["custom-drone-development", "drone-payload", "drone-manufacturer-india", "drone-engineering-consulting"],
  },
  {
    slug: "custom-drone-development",
    title: "Custom Drone Development India | Drone OEM & ODM | Decouvertes",
    description:
      "Custom drone development and manufacturing — bespoke UAV design, drone OEM and ODM services, prototyping and integration by Decouvertes Future Technologies, India.",
    keywords: ["custom drone manufacturer", "custom drone development", "drone oem", "drone odm", "drone prototyping", "drone integration", "bespoke uav"],
    eyebrow: "Custom Engineering",
    h1: "Custom Drone Development",
    intro:
      "When an off-the-shelf platform cannot meet the requirement, the alternative is to engineer one that can. Decouvertes takes mission requirements through design, prototyping, validation and production as an OEM/ODM partner.",
    capabilities: [
      { title: "Requirement capture", body: "Turning an operational need into a written, testable engineering specification." },
      { title: "Bespoke airframe design", body: "Structure and aerodynamics designed around your payload and endurance targets." },
      { title: "Electronics development", body: "Power, control and communication hardware designed and integrated in-house." },
      { title: "Software customisation", body: "Flight behaviour, mission logic and ground interface adapted to your workflow." },
      { title: "OEM and ODM builds", body: "Design and manufacture of platforms delivered under your programme or brand." },
      { title: "Lifecycle support", body: "Documentation, spares definition and engineering support after delivery." },
    ],
    sections: [
      {
        heading: "How a custom programme runs",
        body: "We start with a requirement workshop that converts an operational need into measurable parameters: payload mass and volume, endurance, range, environment, launch constraints and interface requirements. That specification drives a concept design and a costed development plan with defined milestones — prototype, flight test, validation, production readiness.",
      },
      {
        heading: "OEM and ODM engagement",
        body: "In an OEM engagement you bring a design or a detailed specification and we manufacture to it. In an ODM engagement we carry out the design work as well, delivering a platform you can badge and support as your own. Both models are supported, with the intellectual property arrangement agreed up front.",
      },
      {
        heading: "Managing risk",
        body: "Custom development carries technical risk, and hiding it helps nobody. We identify the highest-risk unknowns early and retire them with focused prototypes before committing to the full build, so problems surface while they are still cheap to fix.",
      },
    ],
    faqs: [
      { q: "What is a drone OEM?", a: "A drone OEM (original equipment manufacturer) manufactures unmanned aircraft to a specification or design. An ODM (original design manufacturer) additionally carries out the design work, delivering a complete platform that the customer can sell or deploy under their own name." },
      { q: "How long does custom drone development take?", a: "Timelines depend on how much of the design is new. Adapting an existing platform is considerably faster than a clean-sheet design. We provide a milestone-based schedule after the requirement workshop." },
      { q: "Who owns the intellectual property?", a: "IP ownership is agreed contractually at the start of the programme and depends on the engagement model and the funding arrangement." },
    ],
    related: ["drone-r-and-d", "uav-manufacturer", "drone-electronics", "drone-payload"],
  },
  {
    slug: "drone-engineering-consulting",
    title: "Drone Consulting India | UAV Engineering Consultancy | Decouvertes",
    description:
      "Drone consulting and UAV engineering consultancy — feasibility studies, platform selection, technical review and programme advisory by Decouvertes Future Technologies.",
    keywords: ["drone consulting", "uav consulting", "drone engineering", "drone advisory", "drone feasibility study", "aerospace engineering"],
    eyebrow: "Consulting",
    h1: "Drone & UAV Engineering Consulting",
    intro:
      "Not every problem starts with building an aircraft. Sometimes the right first step is an honest technical assessment of whether a UAV solves the problem at all, and if so, which one.",
    capabilities: [
      { title: "Feasibility studies", body: "Assessing whether a proposed unmanned solution is technically and operationally viable." },
      { title: "Platform selection", body: "Independent evaluation of candidate platforms against a written requirement." },
      { title: "Technical due diligence", body: "Review of designs, claims and test evidence for investors and procurement teams." },
      { title: "Concept of operations", body: "Defining how a UAV capability would actually be deployed, crewed and sustained." },
      { title: "Design review", body: "Engineering review of an in-progress design against its requirements and failure modes." },
      { title: "Regulatory orientation", body: "Understanding the Indian regulatory context that applies to a proposed operation." },
    ],
    sections: [
      {
        heading: "When consulting is the right start",
        body: "Organisations often approach unmanned systems with a solution already chosen. A short feasibility engagement tests that assumption against physics, cost and operational reality before significant money is committed. The outcome may confirm the plan, redirect it, or show that a different technology fits better.",
      },
      {
        heading: "Independent technical review",
        body: "Claims about endurance, range and payload are easy to make and hard to verify. We review test evidence, methodology and design margins so procurement decisions rest on what has been demonstrated rather than what has been stated.",
      },
      {
        heading: "Working with your team",
        body: "Consulting engagements are scoped tightly with a defined question, an agreed method and a written deliverable. Where the answer points to development work, we can continue as an engineering partner — but the assessment stands on its own.",
      },
    ],
    faqs: [
      { q: "What does a drone consultant do?", a: "A drone consultant assesses whether and how unmanned systems can solve a specific operational problem — covering feasibility, platform selection, concept of operations, technical review and regulatory context — and delivers a written recommendation." },
      { q: "Can you review a design we already have?", a: "Yes. We carry out independent engineering design reviews against stated requirements, examining failure modes, margins and test evidence." },
      { q: "How are consulting engagements scoped?", a: "Each engagement has a defined question, an agreed method, a timeline and a written deliverable agreed before work starts." },
    ],
    related: ["drone-r-and-d", "custom-drone-development", "drone-services", "uav-manufacturer"],
  },
  {
    slug: "fixed-wing-drone",
    title: "Fixed Wing UAV India | Long Range Fixed Wing Drone | Decouvertes",
    description:
      "Fixed wing UAV design and manufacturing in India — long range, high endurance fixed wing drones for survey, surveillance and defence by Decouvertes.",
    keywords: ["fixed wing uav", "fixed wing drone", "long range drone", "long endurance uav", "survey drone", "fixed wing drone india"],
    eyebrow: "Fixed Wing",
    h1: "Fixed Wing UAV Platforms",
    intro:
      "When the mission is measured in kilometres and hours rather than metres and minutes, a fixed wing is the efficient answer. Lift comes from the wing rather than from continuously spinning rotors, and endurance improves accordingly.",
    capabilities: [
      { title: "Endurance-driven design", body: "Wing and propulsion sizing chosen to maximise useful time in the air." },
      { title: "Long range operation", body: "Communication and navigation architecture matched to beyond-close-range missions." },
      { title: "Efficient cruise", body: "Aerodynamic design focused on cruise efficiency at the mission speed and altitude." },
      { title: "Survey payloads", body: "Mapping and survey camera integration with consistent trigger and geotagging." },
      { title: "Launch and recovery", body: "Launch and recovery methods selected for the available operating area." },
      { title: "Field serviceability", body: "Modular construction so wings, booms and payload bays can be replaced in the field." },
    ],
    sections: [
      {
        heading: "Fixed wing versus multirotor",
        body: "A multirotor spends energy simply staying up. A fixed wing converts forward motion into lift, so for the same battery mass it covers far more ground and stays airborne longer. The trade-off is that it cannot hover, needs space or equipment to launch and recover, and must keep moving. For corridor mapping, large-area survey and long-range observation, that trade-off strongly favours fixed wing.",
      },
      {
        heading: "Mission planning considerations",
        body: "Fixed wing missions require attention to wind, turn radius, launch and recovery zones and the airspace along the whole route rather than just at the site. Planning tools and pre-flight checks are built around those constraints.",
      },
      {
        heading: "Where fixed wing fits",
        body: "Large-area mapping, pipeline and powerline corridors, coastline and border monitoring, agricultural survey at scale, and any reconnaissance task where the area of interest is well beyond the launch point.",
      },
    ],
    faqs: [
      { q: "What is a fixed wing UAV?", a: "A fixed wing UAV is an unmanned aircraft that generates lift from a wing in forward flight, like a conventional aeroplane, rather than from rotors. This gives greater range and endurance than a multirotor of similar mass but removes the ability to hover." },
      { q: "How far can a fixed wing drone fly?", a: "Range depends on wing design, propulsion, energy storage, payload and the communication link. Fixed wing platforms typically achieve substantially greater range and endurance than multirotors of comparable mass." },
      { q: "Can a fixed wing drone take off vertically?", a: "Not by itself, but a VTOL hybrid combines vertical lift rotors with a fixed wing to achieve vertical launch and recovery alongside efficient cruise." },
    ],
    related: ["vtol-drone", "uav-manufacturer", "military-drones", "drone-services"],
  },
  {
    slug: "vtol-drone",
    title: "VTOL Drone India | Hybrid VTOL UAV Systems | Decouvertes",
    description:
      "VTOL drones and hybrid VTOL UAV platforms — vertical take-off with fixed wing endurance, engineered in India by Decouvertes Future Technologies.",
    keywords: ["vtol drone", "vtol uav", "hybrid vtol", "vertical takeoff drone", "vtol drone india"],
    eyebrow: "VTOL",
    h1: "VTOL Drone Platforms",
    intro:
      "VTOL platforms remove the runway from the equation. Vertical lift for launch and recovery, wing-borne flight for the cruise — one aircraft covering two flight regimes.",
    capabilities: [
      { title: "Vertical launch and recovery", body: "Operation from confined sites with no runway, catapult or recovery net." },
      { title: "Wing-borne cruise", body: "Efficient forward flight once transitioned, for range and endurance." },
      { title: "Transition control", body: "Controlled, repeatable transition between hover and forward flight in both directions." },
      { title: "Mixed propulsion", body: "Lift and cruise propulsion systems designed and managed as one power architecture." },
      { title: "Payload capacity", body: "Payload bay sized for survey, surveillance or mission-specific sensors." },
      { title: "Wind tolerance", body: "Transition and hover behaviour tested against realistic wind conditions." },
    ],
    sections: [
      {
        heading: "Why VTOL",
        body: "Many operating sites have no space for a fixed wing launch and recovery — forward locations, ship decks, forested or built-up areas, or simply sites where a recovery net is impractical. VTOL gives fixed wing endurance without that constraint, which for many operators is the difference between a usable capability and one that stays in its case.",
      },
      {
        heading: "The engineering trade",
        body: "VTOL adds lift rotors, their motors and structure, and the control complexity of transition. That mass and complexity cost some of the endurance a pure fixed wing would have delivered. The design work lies in minimising that penalty — clean rotor integration, low-drag stowage and careful power system sizing.",
      },
      {
        heading: "Transition as the critical phase",
        body: "The transition between hover and cruise is the highest-risk part of a VTOL flight. Control logic, airspeed thresholds and abort behaviour are specified explicitly and validated through repeated flight testing across the wind and mass envelope.",
      },
    ],
    faqs: [
      { q: "What is a VTOL drone?", a: "A VTOL drone is a hybrid unmanned aircraft that takes off and lands vertically using rotors, then transitions to wing-borne forward flight for efficient cruise, combining multirotor convenience with fixed wing endurance." },
      { q: "Is a VTOL drone better than a fixed wing?", a: "It depends on the site. VTOL removes launch and recovery constraints but carries extra mass and complexity, which reduces endurance relative to a pure fixed wing of the same size." },
      { q: "How does VTOL transition work?", a: "The aircraft lifts vertically on rotors, accelerates forward until the wing generates enough lift, then reduces or stops the lift rotors. The reverse sequence is used for recovery." },
    ],
    related: ["fixed-wing-drone", "uav-manufacturer", "custom-drone-development", "drone-electronics"],
  },
  {
    slug: "fpv-drone",
    title: "FPV Drone India | First Person View & Tactical FPV Systems | Decouvertes",
    description:
      "FPV drones engineered in India — first person view platforms, low-latency video links and tactical FPV systems developed by Decouvertes Future Technologies.",
    keywords: ["fpv drone", "fpv drones", "first person view drone", "tactical fpv", "fpv drone india", "fpv systems"],
    eyebrow: "FPV",
    h1: "FPV Drone Systems",
    intro:
      "FPV puts the operator inside the aircraft. Low-latency video, direct control and an agile airframe make it possible to fly precisely through spaces where a conventional platform cannot go.",
    capabilities: [
      { title: "Low-latency video", body: "Video link architecture chosen and tuned to keep glass-to-glass latency low enough for precise control." },
      { title: "Agile airframes", body: "High thrust-to-weight structures designed for responsiveness and confined-space flight." },
      { title: "Robust control link", body: "Control link selection matched to the required range and RF environment." },
      { title: "Durable construction", body: "Frames and prop protection designed for the reality of close-quarters flying." },
      { title: "Payload options", body: "Compact sensor and camera options within tight mass budgets." },
      { title: "Operator training", body: "Familiarisation and practice progression for a control style that differs from GPS-assisted flight." },
    ],
    sections: [
      {
        heading: "What FPV changes",
        body: "Flying line-of-sight limits an operator to what they can see from where they stand. FPV moves the viewpoint to the aircraft, which allows flight inside structures, under canopy and through confined openings. The cost is that latency and video quality become flight-critical — a delay of even a fraction of a second changes what is controllable.",
      },
      {
        heading: "Latency and link engineering",
        body: "FPV performance is dominated by the video chain: camera, encoder, transmitter, receiver and display. Digital links give cleaner imagery but add processing delay; analogue links degrade gracefully with low latency. Choosing between them is an engineering decision driven by the mission, not a preference.",
      },
      {
        heading: "Applications",
        body: "Inspection inside structures and confined industrial spaces, search in collapsed or cluttered environments, close reconnaissance, and training and skills development for operators who need precise manual control.",
      },
    ],
    faqs: [
      { q: "What is an FPV drone?", a: "An FPV (first person view) drone streams live video from an onboard camera to the operator's goggles or screen, so the operator flies from the aircraft's viewpoint rather than by watching it from the ground." },
      { q: "Why does FPV latency matter?", a: "The operator reacts to what they see. Any delay between the camera capturing an image and the operator seeing it directly delays every control input, which matters most in confined or fast flight." },
      { q: "What are FPV drones used for beyond racing?", a: "Confined-space inspection, search operations in cluttered environments, close reconnaissance, and any task requiring precise manual flight where GPS-assisted modes are unavailable." },
    ],
    related: ["military-drones", "drone-electronics", "custom-drone-development", "uav-manufacturer"],
  },
  {
    slug: "drone-electronics",
    title: "Drone Electronics Manufacturer India | UAV Avionics | Decouvertes",
    description:
      "Drone electronics and UAV avionics — flight controllers, power distribution, telemetry and communication systems developed in India by Decouvertes Future Technologies.",
    keywords: ["drone electronics", "drone electronics manufacturer", "uav avionics", "drone telemetry", "drone communication systems", "drone control systems", "drone hardware"],
    eyebrow: "Avionics",
    h1: "Drone Electronics & UAV Avionics",
    intro:
      "The electronics decide whether an airframe becomes an aircraft. Power, control, sensing and communication hardware are developed and bench-validated in-house at Decouvertes before they ever fly.",
    capabilities: [
      { title: "Power distribution", body: "Battery management, regulation and distribution designed for the platform's full load profile." },
      { title: "Flight control integration", body: "Autopilot hardware integration, sensor calibration and tuning for the specific airframe." },
      { title: "Telemetry systems", body: "Live vehicle state reporting to the ground station with logging for post-flight analysis." },
      { title: "Communication links", body: "Command, telemetry and video links specified for range, bandwidth and interference resilience." },
      { title: "Payload interfaces", body: "Electrical, mechanical and data interfaces that let payloads be swapped without redesign." },
      { title: "EMI and layout", body: "Board and harness layout planned to keep sensitive sensing away from noisy power electronics." },
    ],
    sections: [
      {
        heading: "Power is the constraint",
        body: "Every gram and every watt on a UAV is contested. Power architecture determines endurance, and a poorly designed distribution system loses energy as heat, introduces noise into sensitive sensors, and creates single points of failure. We size and validate the power path against the real load profile, including transient peaks, not just cruise draw.",
      },
      {
        heading: "Electromagnetic environment",
        body: "A drone is a dense package of switching power electronics sitting centimetres from GNSS receivers, magnetometers and radio front ends. Component placement, shielding, harness routing and grounding are design decisions that determine whether navigation is reliable — and they are far cheaper to get right before the first build than after.",
      },
      {
        heading: "Bench before flight",
        body: "Electronics are validated on the bench under representative load, temperature and vibration before integration. Faults found on a bench are diagnosable; faults found in flight are usually expensive.",
      },
    ],
    faqs: [
      { q: "What electronics does a drone need?", a: "At minimum a flight controller with inertial sensing, a power distribution and battery management system, motor controllers, a positioning receiver, a command and telemetry radio, and interfaces for the payload." },
      { q: "What is drone telemetry?", a: "Telemetry is the live stream of vehicle state data — position, attitude, battery, link quality, system status — sent from the aircraft to the ground station and logged for post-flight analysis." },
      { q: "Does Decouvertes design its own drone electronics?", a: "Yes. Power, control and communication hardware are designed, integrated and bench-validated in-house as part of our platform engineering." },
    ],
    related: ["drone-payload", "custom-drone-development", "drone-software", "uav-manufacturer"],
  },
  {
    slug: "drone-ai",
    title: "Drone AI Company India | Machine Learning for UAVs | Decouvertes",
    description:
      "Drone AI development in India — onboard machine learning, computer vision, autonomous perception and aerial analytics by Decouvertes Future Technologies.",
    keywords: ["drone ai", "ai drone company", "drone computer vision", "drone machine learning", "drone perception", "drone analytics", "robotics"],
    eyebrow: "Drone AI",
    h1: "Drone AI & Machine Learning",
    intro:
      "Decouvertes develops the perception layer that sits between a drone's sensors and its decisions — computer vision, machine learning models and the engineering required to run them within an aircraft's power and mass budget.",
    capabilities: [
      { title: "Computer vision pipelines", body: "End-to-end image processing from sensor capture through to structured detection output." },
      { title: "Model development", body: "Training, evaluating and iterating models on representative aerial data." },
      { title: "Edge deployment", body: "Optimising and deploying models onto constrained onboard compute." },
      { title: "Perception for autonomy", body: "Feeding perception output into flight behaviour and mission logic." },
      { title: "Data pipelines", body: "Collection, annotation and versioning of the aerial datasets models are trained on." },
      { title: "Honest evaluation", body: "Measuring model performance on held-out flights rather than on training data." },
    ],
    sections: [
      {
        heading: "Aerial perception is its own problem",
        body: "Models trained on ground-level imagery generalise poorly to aerial views. Objects are small, viewed obliquely or from directly above, scale changes with altitude, and thermal imagery has entirely different statistics from visible light. Useful aerial models need data collected under the conditions they will actually face.",
      },
      {
        heading: "From detection to decision",
        body: "A bounding box is not an outcome. Perception becomes useful when it feeds something: an alert to an operator, a geolocated report, a gimbal that keeps a target centred, or a flight behaviour that changes in response. We design the perception stack together with what consumes its output.",
      },
      {
        heading: "Robotics beyond flight",
        body: "The same perception, control and autonomy engineering applies across robotics. Our work in aerial systems shares tooling and methods with broader autonomous platform development.",
      },
    ],
    faqs: [
      { q: "What is drone AI?", a: "Drone AI refers to machine learning and computer vision running on or for an unmanned aircraft — interpreting camera and sensor data to detect and classify objects, track targets, navigate, and generate analytics from aerial imagery." },
      { q: "Can AI models run onboard a drone?", a: "Yes, within the aircraft's mass and power budget. Models are optimised and deployed onto companion compute so inference happens in flight rather than after landing." },
      { q: "What data is needed to train a drone AI model?", a: "Representative aerial imagery captured at the altitudes, angles, lighting and sensor types the model will face in operation, with accurate annotation and a held-out set for honest evaluation." },
    ],
    related: ["ai-drone", "autonomous-drone", "drone-software", "isr-drone"],
  },
  {
    slug: "drone-software",
    title: "Drone Software Company India | UAV Software & Ground Control | Decouvertes",
    description:
      "Drone software development — flight software, ground control stations, mission planning and fleet management built in India by Decouvertes Future Technologies.",
    keywords: ["drone software", "drone software company", "uav software", "ground control station", "mission planning software", "drone fleet management"],
    eyebrow: "Software",
    h1: "Drone Software & Ground Control",
    intro:
      "Most of what an operator experiences is software. Decouvertes develops the flight-side logic, the ground control station and the data workflow that turns a flight into a usable result.",
    capabilities: [
      { title: "Flight software", body: "Onboard mission logic, payload control and fault handling layered above the autopilot." },
      { title: "Ground control station", body: "Mission planning, live telemetry, map display and payload control in one operator interface." },
      { title: "Mission planning", body: "Route, altitude, coverage and payload action planning with pre-flight validation." },
      { title: "Fleet management", body: "Tracking multiple aircraft, their flight hours, maintenance state and mission history." },
      { title: "Data workflow", body: "Automatic ingest, organisation and processing of imagery and logs after each flight." },
      { title: "Integration APIs", body: "Interfaces so UAV data can flow into the customer's existing systems." },
    ],
    sections: [
      {
        heading: "Designing for the operator",
        body: "A ground control station is used outdoors, in sunlight, often under time pressure and sometimes with gloves on. That shapes everything: contrast, control sizes, how many taps a launch takes, how a warning is presented, and what happens when the operator does the wrong thing. Interface decisions here are safety decisions.",
      },
      {
        heading: "Safety-relevant software",
        body: "Flight software has to behave predictably when things fail. Link loss, GNSS degradation, low battery, sensor disagreement and payload faults each need a defined, tested response. We specify those behaviours explicitly and verify them in flight test rather than trusting defaults.",
      },
      {
        heading: "After the flight",
        body: "Value is often lost between landing and analysis. Automatic ingest of imagery and logs, consistent naming and organisation, and repeatable processing mean the operator gets a result rather than a folder of files.",
      },
    ],
    faqs: [
      { q: "What is a ground control station?", a: "A ground control station is the software and hardware an operator uses to plan a mission, monitor the aircraft in flight, control the payload and review results. It displays telemetry, map position, video and system warnings." },
      { q: "Does Decouvertes develop custom drone software?", a: "Yes. Flight-side mission logic, ground control interfaces, fleet management and data workflow can all be adapted to a customer's operational requirements." },
      { q: "Can drone data integrate with our existing systems?", a: "Yes. We build interfaces so mission data, imagery and analytics can be exported into existing GIS, asset management or command systems." },
    ],
    related: ["drone-ai", "autonomous-drone", "drone-electronics", "drone-services"],
  },
  {
    slug: "drone-payload",
    title: "Drone Payload Systems India | UAV Sensor Integration | Decouvertes",
    description:
      "Drone payload design and integration — EO/IR gimbals, thermal sensors, mapping cameras and custom UAV payload systems engineered by Decouvertes, India.",
    keywords: ["drone payload", "uav payload", "drone sensor integration", "eo ir payload", "gimbal", "thermal payload", "drone camera systems"],
    eyebrow: "Payloads",
    h1: "Drone Payload Systems & Integration",
    intro:
      "The payload is why the aircraft flies. Decouvertes designs and integrates payload systems — mechanically, electrically and in software — so the sensor performs as well in the air as it does on the bench.",
    capabilities: [
      { title: "EO/IR gimbals", body: "Stabilised electro-optical and infrared payloads with operator-controlled pointing and zoom." },
      { title: "Thermal imaging", body: "Thermal sensor integration for night operation, inspection and detection tasks." },
      { title: "Mapping cameras", body: "Survey camera integration with precise trigger timing and position tagging." },
      { title: "Custom sensors", body: "Mechanical and electrical integration of mission-specific or customer-supplied sensors." },
      { title: "Modular mounts", body: "Standardised interfaces so payloads swap in the field without tools or recalibration." },
      { title: "Data handling", body: "Onboard recording, downlink and post-flight ingest paths designed with the payload." },
    ],
    sections: [
      {
        heading: "Integration is more than mounting",
        body: "A payload draws power, generates heat, adds mass at a specific location, produces electrical noise and needs a data path. Each of those interacts with the aircraft: centre of gravity shifts, endurance drops, GNSS reception may degrade, and downlink bandwidth is consumed. Proper integration accounts for all of it before the first flight.",
      },
      {
        heading: "Stabilisation and pointing",
        body: "At altitude, a fraction of a degree of movement translates to metres on the ground. Gimbal stabilisation quality determines whether imagery is usable and whether a geolocated observation is accurate. Mounting stiffness, vibration isolation and gimbal control tuning are all part of that result.",
      },
      {
        heading: "Modularity",
        body: "A platform that requires a workshop visit to change payload is a platform with one mission. Standardised mechanical, electrical and data interfaces let an operator reconfigure in the field for the task in front of them.",
      },
    ],
    faqs: [
      { q: "What is a drone payload?", a: "A drone payload is the mission equipment an unmanned aircraft carries — typically cameras, thermal imagers, gimbals, mapping sensors or other task-specific instruments — as distinct from the systems needed to fly." },
      { q: "How much payload can a drone carry?", a: "Payload capacity depends on the platform's size, propulsion and energy budget, and every gram of payload reduces endurance. Capacity is specified per platform against a stated endurance." },
      { q: "Can you integrate a sensor we already own?", a: "Yes. We handle mechanical mounting, power, data interfacing and software integration for customer-supplied sensors, subject to a mass, power and interface review." },
    ],
    related: ["drone-electronics", "isr-drone", "surveillance-drone", "custom-drone-development"],
  },
];

export const getSeoLandingPage = (slug: string) =>
  seoLandingPages.find((p) => p.slug === slug);

/** Route aliases so requested URLs resolve to the right page. */
export const seoLandingAliases: Record<string, string> = {
  "drone-consulting": "drone-engineering-consulting",
};
