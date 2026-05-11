import os
import unittest
from unittest.mock import MagicMock, patch

from src.local_llm import DEFAULT_OLLAMA_MODEL, chat_with_ollama_model, get_ollama_model


class LocalLlmConfigTests(unittest.TestCase):
    def test_default_model_is_local_gemma4_latest_when_env_missing(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(get_ollama_model(), DEFAULT_OLLAMA_MODEL)

    def test_env_model_name_overrides_default(self):
        with patch.dict(os.environ, {"OLLAMA_MODEL": "deepseek-r1:8b"}, clear=True):
            self.assertEqual(get_ollama_model(), "deepseek-r1:8b")

    def test_blank_env_falls_back_to_default(self):
        with patch.dict(os.environ, {"OLLAMA_MODEL": "   "}, clear=True):
            self.assertEqual(get_ollama_model(), DEFAULT_OLLAMA_MODEL)

    def test_chat_uses_selected_model(self):
        client = MagicMock()
        client.chat.return_value = {"message": {"content": "ok"}}

        with patch.dict(os.environ, {"OLLAMA_MODEL": "gemma4:latest"}, clear=True):
            result = chat_with_ollama_model(
                [{"role": "user", "content": "hello"}],
                client=client,
            )

        client.chat.assert_called_once_with(
            model="gemma4:latest",
            messages=[{"role": "user", "content": "hello"}],
        )
        self.assertEqual(result, {"message": {"content": "ok"}})


if __name__ == "__main__":
    unittest.main()
