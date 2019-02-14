export default function Message(time, id, name, avatar, content) {
  const data = {
    time: time,
    from: {
      id: id,
      name: name,
      avatar: avatar
    },
    content: content
  };

  return data;
}
