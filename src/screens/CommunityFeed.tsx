import React, { useState, useEffect } from 'react';
import { View, FlatList, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Post from './CommunityPage';
import { db } from "../../firebaseConfig";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";

// Example communities and posts for demonstration
const sampleCommunities = [
  'Fitness Enthusiasts',
  'Yoga Lovers',
  'Weightlifters',
  'Cardio Kings',
  'Healthy Eating',
  'Mindfulness and Meditation',
  'Running Buffs',
  'Cycling Club',
  'CrossFit Crew',
  'Pilates Practitioners',
  'Martial Arts Masters',
  'Dance Fitness',
  'Swimming Stars',
  'Triathlon Tribe',
  'Bodybuilding Bros',
  'HIIT Heroes',
  'Zumba Zone',
  'Outdoor Adventures',
  'Climbing Club',
  'Rowing Rookies'
];

const samplePosts = {
  'Fitness Enthusiasts': [
    { id: '1', content: 'I just ran a 5k!', username: 'Alice', profilePicture: 'https://example.com/profile1.jpg', timestamp: '2024-05-01' },
    { id: '2', content: 'Starting a new workout plan!', username: 'Bob', profilePicture: 'https://example.com/profile2.jpg', timestamp: '2024-05-02' },
  ],
  'Yoga Lovers': [
    { id: '1', content: 'Morning yoga session was amazing.', username: 'Carol', profilePicture: 'https://example.com/profile3.jpg', timestamp: '2024-05-03' },
    { id: '2', content: 'Yoga helps me stay calm.', username: 'Dave', profilePicture: 'https://example.com/profile4.jpg', timestamp: '2024-05-04' },
  ],
  'Weightlifters': [
    { id: '1', content: 'Lifted my personal best today!', username: 'Eve', profilePicture: 'https://example.com/profile5.jpg', timestamp: '2024-05-05' },
    { id: '2', content: 'Strength training is the best.', username: 'Frank', profilePicture: 'https://example.com/profile6.jpg', timestamp: '2024-05-06' },
  ],
  'Cardio Kings': [
    { id: '1', content: 'Cardio day at the gym!', username: 'Grace', profilePicture: 'https://example.com/profile7.jpg', timestamp: '2024-05-07' },
    { id: '2', content: 'Love running outdoors.', username: 'Hank', profilePicture: 'https://example.com/profile8.jpg', timestamp: '2024-05-08' },
  ],
  'Healthy Eating': [
    { id: '1', content: 'Eating clean feels great.', username: 'Ivy', profilePicture: 'https://example.com/profile9.jpg', timestamp: '2024-05-09' },
    { id: '2', content: 'Healthy recipes to share!', username: 'Jack', profilePicture: 'https://example.com/profile10.jpg', timestamp: '2024-05-10' },
  ],
  'Mindfulness and Meditation': [
    { id: '1', content: 'Meditation helps me focus.', username: 'Kate', profilePicture: 'https://example.com/profile11.jpg', timestamp: '2024-05-11' },
    { id: '2', content: 'Mindfulness is key to a peaceful life.', username: 'Leo', profilePicture: 'https://example.com/profile12.jpg', timestamp: '2024-05-12' },
  ],
  'Running Buffs': [
    { id: '1', content: 'Training for my first marathon!', username: 'Mia', profilePicture: 'https://example.com/profile13.jpg', timestamp: '2024-05-13' },
    { id: '2', content: 'Running is my therapy.', username: 'Nate', profilePicture: 'https://example.com/profile14.jpg', timestamp: '2024-05-14' },
  ],
  'Cycling Club': [
    { id: '1', content: 'Cycling through the countryside.', username: 'Olive', profilePicture: 'https://example.com/profile15.jpg', timestamp: '2024-05-15' },
    { id: '2', content: 'Love my new bike!', username: 'Pete', profilePicture: 'https://example.com/profile16.jpg', timestamp: '2024-05-16' },
  ],
  'CrossFit Crew': [
    { id: '1', content: 'CrossFit workouts are intense!', username: 'Quinn', profilePicture: 'https://example.com/profile17.jpg', timestamp: '2024-05-17' },
    { id: '2', content: 'Pushing my limits every day.', username: 'Rita', profilePicture: 'https://example.com/profile18.jpg', timestamp: '2024-05-18' },
  ],
  'Pilates Practitioners': [
    { id: '1', content: 'Pilates for flexibility.', username: 'Sam', profilePicture: 'https://example.com/profile19.jpg', timestamp: '2024-05-19' },
    { id: '2', content: 'Love the core workouts.', username: 'Tina', profilePicture: 'https://example.com/profile20.jpg', timestamp: '2024-05-20' },
  ],
  'Martial Arts Masters': [
    { id: '1', content: 'Practicing my kicks.', username: 'Uma', profilePicture: 'https://example.com/profile21.jpg', timestamp: '2024-05-21' },
    { id: '2', content: 'Martial arts for discipline.', username: 'Vince', profilePicture: 'https://example.com/profile22.jpg', timestamp: '2024-05-22' },
  ],
  'Dance Fitness': [
    { id: '1', content: 'Dance workout was fun!', username: 'Wendy', profilePicture: 'https://example.com/profile23.jpg', timestamp: '2024-05-23' },
    { id: '2', content: 'Dancing keeps me fit.', username: 'Xander', profilePicture: 'https://example.com/profile24.jpg', timestamp: '2024-05-24' },
  ],
  'Swimming Stars': [
    { id: '1', content: 'Swimming laps today.', username: 'Yara', profilePicture: 'https://example.com/profile25.jpg', timestamp: '2024-05-25' },
    { id: '2', content: 'Water workouts are great.', username: 'Zane', profilePicture: 'https://example.com/profile26.jpg', timestamp: '2024-05-26' },
  ],
  'Triathlon Tribe': [
    { id: '1', content: 'Training for my first triathlon!', username: 'Amy', profilePicture: 'https://example.com/profile27.jpg', timestamp: '2024-05-27' },
    { id: '2', content: 'Triathlons are the ultimate test.', username: 'Ben', profilePicture: 'https://example.com/profile28.jpg', timestamp: '2024-05-28' },
  ],
  'Bodybuilding Bros': [
    { id: '1', content: 'Bodybuilding for muscle gain.', username: 'Cara', profilePicture: 'https://example.com/profile29.jpg', timestamp: '2024-05-29' },
    { id: '2', content: 'Hitting the gym hard.', username: 'Dan', profilePicture: 'https://example.com/profile30.jpg', timestamp: '2024-05-30' },
  ],
  'HIIT Heroes': [
    { id: '1', content: 'HIIT workouts are intense.', username: 'Ella', profilePicture: 'https://example.com/profile31.jpg', timestamp: '2024-05-31' },
    { id: '2', content: 'Love the burn!', username: 'Finn', profilePicture: 'https://example.com/profile32.jpg', timestamp: '2024-06-01' },
  ],
  'Zumba Zone': [
    { id: '1', content: 'Zumba class was a blast!', username: 'Gina', profilePicture: 'https://example.com/profile33.jpg', timestamp: '2024-06-02' },
    { id: '2', content: 'Dance away the calories.', username: 'Harry', profilePicture: 'https://example.com/profile34.jpg', timestamp: '2024-06-03' },
  ],
  'Outdoor Adventures': [
    { id: '1', content: 'Hiking through the mountains.', username: 'Isla', profilePicture: 'https://example.com/profile35.jpg', timestamp: '2024-06-04' },
    { id: '2', content: 'Nature is the best gym.', username: 'Jake', profilePicture: 'https://example.com/profile36.jpg', timestamp: '2024-06-05' },
  ],
  'Climbing Club': [
    { id: '1', content: 'Rock climbing is thrilling.', username: 'Kara', profilePicture: 'https://example.com/profile37.jpg', timestamp: '2024-06-06' },
    { id: '2', content: 'Bouldering is fun.', username: 'Liam', profilePicture: 'https://example.com/profile38.jpg', timestamp: '2024-06-07' },
  ],
  'Rowing Rookies': [
    { id: '1', content: 'Rowing session today.', username: 'Mona', profilePicture: 'https://example.com/profile39.jpg', timestamp: '2024-06-08' },
    { id: '2', content: 'Rowing for cardio.', username: 'Nate', profilePicture: 'https://example.com/profile40.jpg', timestamp: '2024-06-09' },
  ],
};

const Feed: React.FC = () => {
  const [communities, setCommunities] = useState<string[]>(sampleCommunities);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);

  const fetchCommunities = async () => {
    // This function can be updated to fetch communities from Firebase
    if (!user) return;

    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      const userCommunities = userDoc.data()?.communities || [];
      
      const communitiesSnapshot = await db.collection('communities')
        .where('name', 'in', userCommunities).get();

      const communitiesList = communitiesSnapshot.docs.map(doc => doc.data().name);
      setCommunities(communitiesList);
    } catch (error) {
      console.error('Error fetching communities: ', error);
    }
  };

  const fetchPosts = async (community: string) => {
    // This function can be updated to fetch posts from Firebase
    try {
      const postsList = samplePosts[community] || [];
      setPosts(postsList);
    } catch (error) {
      console.error('Error fetching posts: ', error);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    if (selectedCommunity) {
      fetchPosts(selectedCommunity);
    }
  }, [selectedCommunity]);

  return (
    <View style={styles.container}>
      {!selectedCommunity ? (
        <ScrollView>
          {communities.map((community, index) => (
            <TouchableOpacity key={index} style={styles.communityItem} onPress={() => setSelectedCommunity(community)}>
              <Text style={styles.communityText}>{community}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View>
          <TouchableOpacity style={styles.backButton} onPress={() => setSelectedCommunity(null)}>
            <Text style={styles.backButtonText}>Back to Communities</Text>
          </TouchableOpacity>
          <FlatList
            data={posts}
            renderItem={({ item }) => <Post post={item} />}
            keyExtractor={(item) => item.id}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  backButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
    marginVertical: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  communityItem: {
    backgroundColor: '#007bff',
    padding: 10,
    marginVertical: 5,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  communityText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Feed;
