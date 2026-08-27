#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <audioclient.h>
#include <propkey.h>
#include <functiondiscoverykeys_devpkey.h>
#include <mmdeviceapi.h>
#include <propvarutil.h>
#include <wrl/client.h>

#include <algorithm>
#include <cwctype>
#include <iostream>
#include <string>
#include <vector>

using Microsoft::WRL::ComPtr;

struct DeviceShareMode {
    DWORD mode;
    DWORD unknown;
};

MIDL_INTERFACE("F8679F50-850A-41CF-9C72-430F290290C8")
IPolicyConfig : public IUnknown {
    virtual HRESULT STDMETHODCALLTYPE GetMixFormat(PCWSTR, WAVEFORMATEX**) = 0;
    virtual HRESULT STDMETHODCALLTYPE GetDeviceFormat(PCWSTR, INT, WAVEFORMATEX**) = 0;
    virtual HRESULT STDMETHODCALLTYPE ResetDeviceFormat(PCWSTR) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetDeviceFormat(PCWSTR, WAVEFORMATEX*, WAVEFORMATEX*) = 0;
    virtual HRESULT STDMETHODCALLTYPE GetProcessingPeriod(PCWSTR, INT, PINT64, PINT64) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetProcessingPeriod(PCWSTR, PINT64) = 0;
    virtual HRESULT STDMETHODCALLTYPE GetShareMode(PCWSTR, DeviceShareMode*) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetShareMode(PCWSTR, DeviceShareMode*) = 0;
    virtual HRESULT STDMETHODCALLTYPE GetPropertyValue(PCWSTR, const PROPERTYKEY&, PROPVARIANT*) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetPropertyValue(PCWSTR, const PROPERTYKEY&, PROPVARIANT*) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetDefaultEndpoint(PCWSTR, ERole) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetEndpointVisibility(PCWSTR, INT) = 0;
};

class DECLSPEC_UUID("870AF99C-171D-4F9E-AF0D-E63DF40C2BC9") PolicyConfigClient;

struct Endpoint {
    std::wstring id;
    std::wstring name;
    int score = -1;
};

static std::wstring Lower(std::wstring value) {
    std::transform(value.begin(), value.end(), value.begin(), [](wchar_t ch) {
        return static_cast<wchar_t>(std::towlower(ch));
    });
    return value;
}

static std::wstring Normalize(const std::wstring& value) {
    std::wstring normalized;
    normalized.reserve(value.size());
    for (wchar_t ch : value) {
        if (std::iswalnum(ch)) {
            normalized.push_back(static_cast<wchar_t>(std::towlower(ch)));
        }
    }
    return normalized;
}

static bool ContainsAny(const std::wstring& value, const std::vector<std::wstring>& needles) {
    for (const auto& needle : needles) {
        if (value.find(needle) != std::wstring::npos) return true;
    }
    return false;
}

static int MatchScore(const std::wstring& friendlyName, const std::wstring& query, EDataFlow flow) {
    const std::wstring normalizedName = Normalize(friendlyName);
    const std::wstring normalizedQuery = Normalize(query);
    if (normalizedQuery.empty() || normalizedName.find(normalizedQuery) == std::wstring::npos) {
        return -1;
    }

    int score = static_cast<int>(normalizedQuery.size() * 10);
    if (normalizedName == normalizedQuery) score += 1000;

    const std::wstring lowerName = Lower(friendlyName);
    if (flow == eRender) {
        if (ContainsAny(lowerName, {L"speaker", L"speakers", L"altoparlanti", L"headphones", L"cuffie", L"stereo"})) {
            score += 100;
        }
        if (ContainsAny(lowerName, {L"hands-free", L"handsfree", L"headset", L"auricolare"})) {
            score -= 50;
        }
    } else if (flow == eCapture) {
        if (ContainsAny(lowerName, {L"microphone", L"microfono", L"headset", L"hands-free", L"handsfree"})) {
            score += 100;
        }
    }
    return score;
}

static HRESULT ReadFriendlyName(IMMDevice* device, std::wstring& name) {
    ComPtr<IPropertyStore> properties;
    HRESULT hr = device->OpenPropertyStore(STGM_READ, &properties);
    if (FAILED(hr)) return hr;

    PROPVARIANT value;
    PropVariantInit(&value);
    hr = properties->GetValue(PKEY_Device_FriendlyName, &value);
    if (SUCCEEDED(hr) && value.vt == VT_LPWSTR && value.pwszVal) {
        name.assign(value.pwszVal);
    } else if (SUCCEEDED(hr)) {
        hr = E_UNEXPECTED;
    }
    PropVariantClear(&value);
    return hr;
}

static HRESULT FindBestEndpoint(
    IMMDeviceEnumerator* enumerator,
    EDataFlow flow,
    const std::wstring& query,
    Endpoint& best
) {
    ComPtr<IMMDeviceCollection> devices;
    HRESULT hr = enumerator->EnumAudioEndpoints(flow, DEVICE_STATE_ACTIVE, &devices);
    if (FAILED(hr)) return hr;

    UINT count = 0;
    hr = devices->GetCount(&count);
    if (FAILED(hr)) return hr;

    best = Endpoint{};
    for (UINT index = 0; index < count; ++index) {
        ComPtr<IMMDevice> device;
        if (FAILED(devices->Item(index, &device))) continue;

        std::wstring name;
        if (FAILED(ReadFriendlyName(device.Get(), name))) continue;
        const int score = MatchScore(name, query, flow);
        if (score <= best.score) continue;

        LPWSTR rawId = nullptr;
        if (FAILED(device->GetId(&rawId)) || !rawId) continue;
        best = Endpoint{rawId, name, score};
        CoTaskMemFree(rawId);
    }

    return best.score >= 0 ? S_OK : HRESULT_FROM_WIN32(ERROR_NOT_FOUND);
}

static HRESULT SetDefaultRoles(const std::wstring& endpointId) {
    ComPtr<IPolicyConfig> policy;
    HRESULT hr = CoCreateInstance(
        __uuidof(PolicyConfigClient),
        nullptr,
        CLSCTX_ALL,
        __uuidof(IPolicyConfig),
        reinterpret_cast<void**>(policy.GetAddressOf())
    );
    if (FAILED(hr)) return hr;

    for (ERole role : {eConsole, eMultimedia, eCommunications}) {
        hr = policy->SetDefaultEndpoint(endpointId.c_str(), role);
        if (FAILED(hr)) return hr;
    }
    return S_OK;
}

static bool IsDefaultEndpointForAllRoles(
    IMMDeviceEnumerator* enumerator,
    EDataFlow flow,
    const std::wstring& expectedId
) {
    for (ERole role : {eConsole, eMultimedia, eCommunications}) {
        ComPtr<IMMDevice> device;
        if (FAILED(enumerator->GetDefaultAudioEndpoint(flow, role, &device))) return false;

        LPWSTR rawId = nullptr;
        if (FAILED(device->GetId(&rawId)) || !rawId) return false;
        const bool matches = _wcsicmp(rawId, expectedId.c_str()) == 0;
        CoTaskMemFree(rawId);
        if (!matches) return false;
    }
    return true;
}

static HRESULT FindEndpointWithRetry(
    IMMDeviceEnumerator* enumerator,
    EDataFlow flow,
    const std::wstring& query,
    DWORD timeoutMs,
    Endpoint& endpoint
) {
    const DWORD started = GetTickCount();
    HRESULT hr = HRESULT_FROM_WIN32(ERROR_NOT_FOUND);
    do {
        hr = FindBestEndpoint(enumerator, flow, query, endpoint);
        if (SUCCEEDED(hr)) return hr;
        Sleep(250);
    } while (GetTickCount() - started < timeoutMs);
    return hr;
}

static void ListEndpoints(IMMDeviceEnumerator* enumerator, EDataFlow flow, const wchar_t* label) {
    ComPtr<IMMDeviceCollection> devices;
    if (FAILED(enumerator->EnumAudioEndpoints(flow, DEVICE_STATE_ACTIVE, &devices))) return;
    UINT count = 0;
    if (FAILED(devices->GetCount(&count))) return;
    for (UINT index = 0; index < count; ++index) {
        ComPtr<IMMDevice> device;
        std::wstring name;
        if (SUCCEEDED(devices->Item(index, &device)) && SUCCEEDED(ReadFriendlyName(device.Get(), name))) {
            std::wcout << label << L": " << name << L"\n";
        }
    }
}

int wmain(int argc, wchar_t** argv) {
    HRESULT hr = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
    if (FAILED(hr)) {
        std::wcerr << L"ERROR: COM initialization failed (0x" << std::hex << hr << L")\n";
        return 1;
    }

    ComPtr<IMMDeviceEnumerator> enumerator;
    hr = CoCreateInstance(
        __uuidof(MMDeviceEnumerator),
        nullptr,
        CLSCTX_ALL,
        IID_PPV_ARGS(&enumerator)
    );
    if (FAILED(hr)) {
        std::wcerr << L"ERROR: Audio endpoint enumeration failed (0x" << std::hex << hr << L")\n";
        CoUninitialize();
        return 1;
    }

    if (argc == 2 && _wcsicmp(argv[1], L"--list") == 0) {
        ListEndpoints(enumerator.Get(), eRender, L"RENDER");
        ListEndpoints(enumerator.Get(), eCapture, L"CAPTURE");
        CoUninitialize();
        return 0;
    }

    if (argc == 3 && _wcsicmp(argv[1], L"--status") == 0) {
        Endpoint render;
        hr = FindBestEndpoint(enumerator.Get(), eRender, argv[2], render);
        if (SUCCEEDED(hr)) {
            std::wcout << L"CONNECTED\n";
            CoUninitialize();
            return 0;
        }
        if (hr == HRESULT_FROM_WIN32(ERROR_NOT_FOUND)) {
            std::wcout << L"DISCONNECTED\n";
            CoUninitialize();
            return 0;
        }

        std::wcerr << L"ERROR: Audio endpoint status check failed (0x"
                   << std::hex << hr << L")\n";
        CoUninitialize();
        return 1;
    }

    if (argc < 2 || argc > 3) {
        std::wcerr << L"ERROR: Usage: AudioEndpointRouter.exe <device name> [a2dp|a2dp-hfp]"
                   << L" | --status <device name> | --list\n";
        CoUninitialize();
        return 1;
    }

    const std::wstring deviceName = argv[1];
    const std::wstring profile = argc == 3 ? Lower(argv[2]) : L"a2dp-hfp";
    if (profile != L"a2dp" && profile != L"a2dp-hfp") {
        std::wcerr << L"ERROR: Unknown audio profile '" << profile << L"'\n";
        CoUninitialize();
        return 1;
    }

    Endpoint render;
    hr = FindEndpointWithRetry(enumerator.Get(), eRender, deviceName, 12000, render);
    if (FAILED(hr)) {
        std::wcerr << L"ERROR: No active playback endpoint matches '" << deviceName << L"'\n";
        CoUninitialize();
        return 2;
    }

    hr = SetDefaultRoles(render.id);
    if (FAILED(hr) || !IsDefaultEndpointForAllRoles(enumerator.Get(), eRender, render.id)) {
        std::wcerr << L"ERROR: Failed to make '" << render.name
                   << L"' the default playback endpoint (0x" << std::hex << hr << L")\n";
        CoUninitialize();
        return 3;
    }

    std::wstring captureName;
    if (profile == L"a2dp-hfp") {
        Endpoint capture;
        if (SUCCEEDED(FindEndpointWithRetry(enumerator.Get(), eCapture, deviceName, 2000, capture))) {
            const HRESULT captureHr = SetDefaultRoles(capture.id);
            if (SUCCEEDED(captureHr) && IsDefaultEndpointForAllRoles(enumerator.Get(), eCapture, capture.id)) {
                captureName = capture.name;
            } else {
                std::wcerr << L"WARNING: Playback was routed, but the matching microphone could not be selected\n";
            }
        }
    }

    std::wcout << L"SUCCESS: Default playback endpoint set to '" << render.name << L"'";
    if (!captureName.empty()) {
        std::wcout << L"; default microphone set to '" << captureName << L"'";
    }
    std::wcout << L"\n";
    CoUninitialize();
    return 0;
}
