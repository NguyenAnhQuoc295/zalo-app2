import User from "../models/user.js";
import Friendship from "../models/Friendship.js";
import Conversation from "../models/conversation.js";

// 1. Tìm kiếm người dùng (CẬP NHẬT: Tìm theo name và email)
export const searchUsers = async (req, res) => {
  try {
    const { keyword } = req.query;

    // Nếu không có keyword, trả về mảng rỗng để tiết kiệm tài nguyên
    if (!keyword) {
      return res.status(200).json([]);
    }

    const users = await User.find({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ],
      _id: { $ne: req.user.id },
    })
      .select(
        "-password -resetPasswordOTP -resetPasswordExpire -resetPasswordAttempts"
      )
      .limit(20);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Gửi lời mời kết bạn (CẬP NHẬT MỚI)
export const sendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id; // Từ Middleware

    // Sử dụng hàm statics buildPair từ Schema của bạn để lấy userLow và userHigh
    const { userLow, userHigh } = Friendship.buildPair(senderId, receiverId);

    // Kiểm tra xem cặp đôi này đã từng tương tác chưa (Bất kể ai gửi)
    const existingFriendship = await Friendship.findOne({ userLow, userHigh });

    if (existingFriendship) {
      return res
        .status(400)
        .json({ message: "Đã tồn tại trạng thái kết bạn giữa 2 người!" });
    }

    // Nếu chưa có, tạo mới
    const newRequest = await Friendship.create({
      userLow,
      userHigh,
      requesterId: senderId,
      receiverId: receiverId,
      status: "pending",
    });

    res
      .status(201)
      .json({ message: "Đã gửi lời mời thành công!", request: newRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Chấp nhận kết bạn (CẬP NHẬT MỚI)
export const acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const currentUserId = req.user.id;

    const request = await Friendship.findById(requestId);
    if (!request)
      return res.status(404).json({ message: "Không tìm thấy lời mời!" });

    if (String(request.receiverId) !== String(currentUserId)) {
      return res.status(403).json({ message: "Bạn không có quyền thao tác!" });
    }

    // ✅ update friendship
    request.status = "accepted";
    request.respondedAt = Date.now();
    await request.save();

    // 🔥 build key (DÙNG HÀM CHUẨN)
    const pairKey = Conversation.buildDirectPairKey(
      request.requesterId,
      request.receiverId
    );

    // 🔥 check tồn tại
    let conversation = await Conversation.findOne({
      "metadata.directPairKey": pairKey,
    });

    // 🔥 nếu chưa có thì tạo
    if (!conversation) {
      try {
        conversation = await Conversation.create({
          type: "direct",
          createdBy: request.requesterId,
          members: [
            { userId: request.requesterId },
            { userId: request.receiverId },
          ],
          metadata: {
            directPairKey: pairKey,
          },
        });
      } catch (err) {
        // 🔒 tránh race condition
        if (err.code === 11000) {
          conversation = await Conversation.findOne({
            "metadata.directPairKey": pairKey,
          });
        } else {
          throw err;
        }
      }
    }

    res.status(200).json({
      message: "Đã trở thành bạn bè!",
      conversation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Từ chối hoặc hủy lời mời kết bạn
export const rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const currentUserId = req.user.id;

    const request = await Friendship.findById(requestId);
    if (!request)
      return res.status(404).json({ message: "Không tìm thấy lời mời!" });

    // Chỉ người nhận hoặc người gửi mới được quyền từ chối / huỷ lời mời
    if (
      String(request.receiverId) !== String(currentUserId) &&
      String(request.requesterId) !== String(currentUserId)
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thao tác trên lời mời này!" });
    }

    // Xóa record lời mời khỏi db để sau này có thể gửi lại nếu đổi ý
    await Friendship.findByIdAndDelete(requestId);

    res.status(200).json({ message: "Đã hủy/từ chối lời mời kết bạn!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Huỷ kết bạn
export const unfriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    const currentUserId = req.user.id;

    // Sử dụng buildPair để tìm record an toàn bất kể ai gửi lời mời ban đầu
    const { userLow, userHigh } = Friendship.buildPair(currentUserId, friendId);

    // Tìm và xóa record kết bạn
    const friendship = await Friendship.findOneAndDelete({ userLow, userHigh });

    if (!friendship) {
      return res.status(404).json({ message: "Hai bạn chưa kết bạn!" });
    }

    // Xóa friendId khỏi mảng friends của user hiện tại
    // await User.findByIdAndUpdate(currentUserId, {
    //   $pull: { friends: friendId },
    // });

    // // Xóa currentUserId khỏi mảng friends của bạn kia
    // await User.findByIdAndUpdate(friendId, {
    //   $pull: { friends: currentUserId },
    // });

    res.status(200).json({ message: "Đã hủy kết bạn thành công!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Lấy danh sách bạn bè
export const getFriends = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const friendships = await Friendship.find({
      status: "accepted",
      $or: [{ userLow: currentUserId }, { userHigh: currentUserId }],
    });

    const friendIds = friendships.map((f) =>
      f.userLow.toString() === currentUserId ? f.userHigh : f.userLow
    );

    const friends = await User.find({
      _id: { $in: friendIds },
    }).select("name email avatarUrl statusMessage accountStatus");

    res.status(200).json(friends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. Lấy danh sách lời mời chờ xác nhận (người khác gửi cho mình)
export const getPendingRequests = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const requests = await Friendship.find({
      receiverId: currentUserId,
      status: "pending",
    })
      .populate("requesterId", "name email avatarUrl statusMessage")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
