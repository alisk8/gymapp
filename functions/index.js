const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const axios = require("axios"); // For sending HTTP requests
const moment = require("moment-timezone");

admin.initializeApp();
const db = admin.firestore();

exports.sendWorkoutReminders = functions.pubsub.schedule("every 1 hours").onRun(async (context) => {
    const now = moment(); // Get the current time in UTC
    const currentDay = now.format("dddd"); // Current day in UTC (e.g., "Monday")
    const currentHour = now.hour(); // Current hour in UTC

    try {
        const userProfilesRef = db.collection("userProfiles");
        const snapshot = await userProfilesRef.where("workout_days", "array-contains", currentDay).get();

        if (snapshot.empty) {
            console.log("No users found for today.");
            return null;
        }

        const notifications = [];
        snapshot.forEach((doc) => {
            const user = doc.data();
            const preferredTime = user.preferred_workout_time.toDate(); // Firestore timestamp to Date
            const userTimeZone = user.timeZone || "UTC"; // Default to UTC if no time zone is saved

            // Convert preferredTime to the user's local time
            const preferredLocalTime = moment(preferredTime).tz(userTimeZone);
            const preferredHour = preferredLocalTime.hour(); // Get hour in the user's local time zone

            // Convert current time to the user's local time
            const currentLocalHour = now.clone().tz(userTimeZone).hour();

            if (preferredHour === currentLocalHour) {
                if (typeof user.notificationToken === "string" && user.notificationToken.startsWith("ExponentPushToken")) {
                    notifications.push({
                        to: user.notificationToken,
                        sound: "default",
                        title: "Time to Workout!",
                        body: `Hey ${user.firstName}, get a workout in today!`,
                        data: { screen: "TemplateScreen" },
                    });
                }
            }
        });

        const sendPromises = notifications.map((message) =>
            axios.post("https://exp.host/--/api/v2/push/send", message, {
                headers: {
                    Accept: "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                },
            })
        );

        const results = await Promise.allSettled(sendPromises);
        results.forEach((result, index) => {
            if (result.status === "rejected") {
                console.error(`Failed to send notification to ${notifications[index].to}:`, result.reason);
            }
        });

        console.log("Notifications sent successfully.");
    } catch (error) {
        console.error("Error sending notifications: ", error);
    }

    return null;
});