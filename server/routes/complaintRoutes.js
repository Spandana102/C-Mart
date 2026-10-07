// CREATE COMPLAINT
router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        userName,
        userEmail,
        subject,
        description,
      } = req.body;

      if (
        !userName ||
        !userEmail ||
        !subject ||
        !description
      ) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }

      const complaint = await Complaint.create({
        userName,
        userEmail,
        subject,
        description,
      });

      res.status(201).json({
        success: true,
        message: "Complaint submitted successfully",
        complaint,
      });
    } catch (error) {
      console.error("Create Complaint Error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to submit complaint",
      });
    }
  }
);